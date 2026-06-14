import { userRepo, plantRepo, plantCareStateService, plantTaskCareManager, plantCareAiInsights, plantCareActionLogger, plantService } from "../shared/container.js";
import { analyzeAndSavePlant } from "./plant-analyser.usecase.js";

async function resolveUserInternalId(user) {
  if (user.internalId) return user.internalId;
  const userDoc = await userRepo.findByUUID(user.uuid);
  return userDoc.internalId;
}

async function performAction(plantUUID, taskType, user, updateFn, actionLog = null) {
  const errors = [];

  let plant;
  try {
    plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  } catch (e) {
    throw e;
  }

  try {
    const delta = await updateFn(plant);
    if (delta && Object.keys(delta).length > 0) {
      await plantRepo.updateByUUID(plantUUID, delta);
    }
  } catch (e) {
    errors.push(`Action failed: ${e.message}`);
  }

  try {
    const careState = await plantCareStateService.getByPlantUUID(plantUUID);
    const task = (careState?.activeTasks || []).find((t) => t.type === taskType);
    if (task) {
      await plantTaskCareManager.completeTask(plantUUID, task.taskId, user, { archive: true });
    }
  } catch (e) {
    errors.push(`Auto-complete task failed: ${e.message}`);
  }

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

  return { status, aiInsights, activeTasks };
}

export async function waterPlant(plantUUID, user) {
  return await performAction(
    plantUUID, "watering", user,
    (plant) => plant.applyWatering(0),
    { actionType: "watered", description: "Plant watered" },
  );
}

export async function fertilizePlant(plantUUID, user) {
  return await performAction(
    plantUUID, "fertilizing", user,
    (plant) => plant.applyFertilizing(),
    { actionType: "fertilized", description: "Plant fertilized" },
  );
}

export async function harvestPlant(plantUUID, user) {
  return await performAction(
    plantUUID, "harvest", user,
    (plant) => plant.applyHarvest(),
    { actionType: "harvested", description: "Plant harvested" },
  );
}

export async function updateLight(plantUUID, user, lightCondition) {
  return await performAction(
    plantUUID, "move_light", user,
    async () => ({}),
    { actionType: "light_changed", description: "Light conditions changed", metadata: { lightCondition } },
  );
}

export async function treatDisease(plantUUID, user) {
  return await performAction(
    plantUUID, "disease_treatment", user,
    (plant) => plant.applyDiseaseTreatment(),
    { actionType: "disease_scan", description: "Disease scan performed" },
  );
}

export async function prunePlant(plantUUID, user) {
  return await performAction(
    plantUUID, "pruning", user,
    (plant) => plant.applyPruning(),
    { actionType: "pruned", description: "Plant pruned" },
  );
}
