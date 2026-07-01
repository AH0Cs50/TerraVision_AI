import { userRepo, plantRepo, plantCareStateService, plantTaskCareManager, plantCareAiInsights, plantCareActionLogger, plantService } from "../shared/container.js";
import { analyzeAndSavePlant } from "./plant-analyser.usecase.js";

/**
 * Resolves a user's internalId from their auth object or database
 * @param {{ uuid: string, internalId?: number }} user - Authenticated user
 * @returns {Promise<number>} The user's internal ID
 */
async function resolveUserInternalId(user) {
  if (user.internalId) return user.internalId;
  const userDoc = await userRepo.findByUUID(user.uuid);
  return userDoc.internalId;
}

/**
 * Core action handler: verifies access, applies entity delta, auto-completes matching task, logs action, runs analysis and AI insights
 * @param {string} plantUUID - Plant's UUID
 * @param {string} taskType - Task type identifier (e.g. "watering", "fertilizing")
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @param {Function} updateFn - Async function receiving plant entity, returns delta object
 * @param {object|null} [actionLog] - Optional action log data { actionType, description, metadata? }
 * @returns {Promise<{ status: object, aiInsights: object, activeTasks: Array }>} Updated care status, AI insights, and active tasks
 */
async function performAction(plantUUID, taskType, user, updateFn, actionLog = null) {
  const errors = [];

  // 1. Verify plant access
  let plant;
  try {
    plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  } catch (e) {
    throw e;
  }

  // 2. Apply entity delta and persist
  try {
    const delta = await updateFn(plant);
    if (delta && Object.keys(delta).length > 0) {
      await plantRepo.updateByUUID(plantUUID, delta);
    }
  } catch (e) {
    errors.push(`Action failed: ${e.message}`);
  }

  // 3. Auto-complete matching active task
  try {
    const careState = await plantCareStateService.getByPlantUUID(plantUUID);
    const task = (careState?.activeTasks || []).find((t) => t.type === taskType);
    if (task) {
      await plantTaskCareManager.completeTask(plantUUID, task.taskId, user, { archive: true });
    }
  } catch (e) {
    errors.push(`Auto-complete task failed: ${e.message}`);
  }

  // 4. Log action to action log
  if (actionLog) {
    try {
      await plantCareActionLogger.addActionLog(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, actionLog);
    } catch (e) {
      errors.push(`Action log failed: ${e.message}`);
    }
  }

  let status = {};
  let aiInsights = {};
  let activeTasks = [];

  // 5. Run full analysis pipeline (engine + task generation + AI insights)
  try {
    const result = await analyzeAndSavePlant(plantUUID, user);
    status = result.status || {};
    activeTasks = result.activeTasks || [];

    const allOptimal =
      status.water === "satisfied" &&
      status.nutrients === "optimal" &&
      status.health === "healthy" &&
      status.light === "optimal";

    if (!allOptimal) {
      const taskResult = await plantTaskCareManager.generateTasksFromStatus(plantUUID, user);
      if (taskResult?.tasks) {
        activeTasks = [...activeTasks, ...taskResult.tasks];
      }
    }

    const logs = await plantCareActionLogger.paginateActionLogs(plantUUID, { page: 1, limit: 100 });
    const insights = await plantCareAiInsights.generateInsights(plantUUID, status, logs.logs || []);
    if (insights.summary) {
      await plantCareStateService.updateByPlantUUID(plantUUID, { aiInsights: insights });
      aiInsights = insights;
    }
  } catch (e) {
    errors.push(`Analysis or insight generation failed: ${e.message}`);
  }

  // 6. Return result
  return { status, aiInsights, activeTasks };
}

/**
 * Records a watering action: resets watering hours, completes watering task, re-analyses plant
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @returns {Promise<{ status: object, aiInsights: object, activeTasks: Array }>} Updated care state
 */
export async function waterPlant(plantUUID, user) {
  return await performAction(
    plantUUID, "watering", user,
    (plant) => plant.applyWatering(0),
    { actionType: "watered", description: "Plant watered" },
  );
}

/**
 * Records a fertilizing action: updates soil nutrients, completes fertilizing task, re-analyses plant
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @returns {Promise<{ status: object, aiInsights: object, activeTasks: Array }>} Updated care state
 */
export async function fertilizePlant(plantUUID, user) {
  return await performAction(
    plantUUID, "fertilizing", user,
    (plant) => plant.applyFertilizing(),
    { actionType: "fertilized", description: "Plant fertilized" },
  );
}

/**
 * Records a harvesting action: applies harvest delta, completes harvest task, re-analyses plant
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @returns {Promise<{ status: object, aiInsights: object, activeTasks: Array }>} Updated care state
 */
export async function harvestPlant(plantUUID, user) {
  return await performAction(
    plantUUID, "harvest", user,
    (plant) => plant.applyHarvest(),
    { actionType: "harvested", description: "Plant harvested" },
  );
}

/**
 * Records a light condition change: logs action with the new light condition, re-analyses plant
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @param {string} lightCondition - New light condition description
 * @returns {Promise<{ status: object, aiInsights: object, activeTasks: Array }>} Updated care state
 */
export async function updateLight(plantUUID, user, lightCondition) {
  return await performAction(
    plantUUID, "move_light", user,
    async () => ({}),
    { actionType: "light_changed", description: "Light conditions changed", metadata: { lightCondition } },
  );
}

/**
 * Records a disease treatment action: applies treatment delta, completes treatment task, re-analyses plant
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @returns {Promise<{ status: object, aiInsights: object, activeTasks: Array }>} Updated care state
 */
export async function treatDisease(plantUUID, user) {
  return await performAction(
    plantUUID, "disease_treatment", user,
    (plant) => plant.applyDiseaseTreatment(),
    { actionType: "disease_scan", description: "Disease scan performed" },
  );
}

/**
 * Records a pruning action: applies pruning delta, completes pruning task, re-analyses plant
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @returns {Promise<{ status: object, aiInsights: object, activeTasks: Array }>} Updated care state
 */
export async function prunePlant(plantUUID, user) {
  return await performAction(
    plantUUID, "pruning", user,
    (plant) => plant.applyPruning(),
    { actionType: "pruned", description: "Plant pruned" },
  );
}
