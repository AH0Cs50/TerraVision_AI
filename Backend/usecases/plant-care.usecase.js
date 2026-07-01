import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { userRepo, plantService, plantCareStateService, plantCareActionLogger, plantTaskCareManager, plantCareAiInsights } from "../shared/container.js";

import { analyzeAndSavePlant } from "./plant-analyser.usecase.js";
import {
  waterPlant,
  fertilizePlant,
  harvestPlant,
  updateLight,
  treatDisease,
  prunePlant,
} from "./plant-care-action.usecase.js";

export { analyzeAndSavePlant, waterPlant, fertilizePlant, harvestPlant, updateLight, treatDisease, prunePlant };

// ── Care State ─────────────────────────────────

/**
 * Retrieves the care state for a plant
 * @param {string} plantUUID - Plant's UUID
 * @returns {Promise<object>} Care state document
 * @throws {RouteError} 404 if care state not found
 */
export async function getCareState(plantUUID) {
  // 1. Fetch care state from database
  const careState = await plantCareStateService.getByPlantUUID(plantUUID);
  // 2. Throw 404 if not found
  if (!careState) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Care state not found");
  }
  return careState;
}

// ── Action Logs ────────────────────────────────

/**
 * Retrieves action logs for a plant, optionally filtered by type, paginated, or limited to recent entries
 * @param {string} plantUUID - Plant's UUID
 * @param {{ type?: string, page?: number, limit?: number, last?: number }} [options] - Query options
 * @returns {Promise<Array|object>} Array of logs or paginated result object
 */
export async function getLogs(plantUUID, { type, page, limit, last } = {}) {
  if (type) {
    return await plantCareActionLogger.getLogsByType(plantUUID, type);
  }

  if (page) {
    return await plantCareActionLogger.paginateActionLogs(plantUUID, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
  }

  const count = parseInt(last) || 5;
  return await plantCareActionLogger.getRecentLogs(plantUUID, count);
}

/**
 * Adds a custom action log entry for a plant, resolving internal IDs
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, internalId?: number }} user - Authenticated user
 * @param {{ actionType: string, description: string, metadata?: object }} [data] - Log entry data
 * @returns {Promise<object>} Created action log
 * @throws {RouteError} 400 if actionType or description is missing
 */
export async function addActionLog(plantUUID, user, { actionType, description, metadata } = {}) {
  // 1. Validate required parameters
  if (!actionType || !description) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "actionType and description are required");
  }

  // 2. Resolve user and plant internal IDs
  const userInternalId = user.internalId || (await userRepo.findByUUID(user.uuid)).internalId;
  const plantInternalId = await plantService.getInternalId(plantUUID);

  // 3. Delegate to logger to persist action
  return await plantCareActionLogger.addActionLog(plantUUID, user.uuid, userInternalId, plantInternalId, {
    actionType,
    description,
    metadata,
  });
}

/**
 * Removes action logs older than a specified date
 * @param {string} plantUUID - Plant's UUID
 * @param {string} [before] - ISO date string; defaults to now
 * @returns {Promise<object>} Deletion result
 * @throws {RouteError} 404 if care state not found
 */
export async function clearOldLogs(plantUUID, before) {
  const date = before ? new Date(before) : new Date();
  const result = await plantCareActionLogger.clearOldLogs(plantUUID, date);

  if (!result) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Care state not found");
  }

  return result;
}

// ── Tasks ──────────────────────────────────────

/**
 * Retrieves paginated tasks for a plant, unwrapping the result array
 * @param {string} plantUUID - Plant's UUID
 * @param {number} [page=1] - Page number
 * @param {number} [limit=20] - Items per page
 * @returns {Promise<Array>} Array of task objects
 */
export async function getTasks(plantUUID, page = 1, limit = 20) {
  const result = await plantTaskCareManager.paginateTasks(plantUUID, { type: 0, page, limit });
  return result.tasks || [];
}

/**
 * Retrieves all overdue tasks for a plant
 * @param {string} plantUUID - Plant's UUID
 * @returns {Promise<Array>} Array of overdue task objects
 */
export async function getOverdueTasks(plantUUID) {
  return await plantTaskCareManager.getOverdueTasks(plantUUID);
}

/**
 * Retrieves all pending (incomplete) tasks for a plant
 * @param {string} plantUUID - Plant's UUID
 * @returns {Promise<Array>} Array of pending task objects
 */
export async function getPendingTasks(plantUUID) {
  return await plantTaskCareManager.getPendingTasks(plantUUID);
}

/**
 * Retrieves tasks sorted by priority for a plant
 * @param {string} plantUUID - Plant's UUID
 * @returns {Promise<Array>} Array of prioritized task objects
 */
export async function getPrioritizedTasks(plantUUID) {
  return await plantTaskCareManager.prioritizeTasks(plantUUID);
}

// ── AI Insights ────────────────────────────────

/**
 * Generates AI-powered care insights for a plant based on its care state and action logs
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, internalId?: number }} user - Authenticated user
 * @returns {Promise<object>} AI-generated insights object
 * @throws {RouteError} 404 if care state not found
 */
export async function generateAiInsights(plantUUID, user) {
  // 1. Fetch care state
  const careState = await plantCareStateService.getByPlantUUID(plantUUID);
  if (!careState) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Care state not found");
  }

  // 2. Fetch recent action logs
  const actionLogs = await plantCareActionLogger.paginateActionLogs(plantUUID, { page: 1, limit: 100 });
  // 3. Generate AI insights from state and logs
  const insights = await plantCareAiInsights.generateInsights(
    plantUUID,
    careState.status,
    actionLogs.logs || [],
  );

  // 4. Resolve internal IDs for logging
  const userInternalId = user.internalId || (await userRepo.findByUUID(user.uuid)).internalId;
  const plantInternalId = await plantService.getInternalId(plantUUID);
  // 5. Log insight generation action
  await plantCareActionLogger.logInsightGenerated(plantUUID, user.uuid, userInternalId, plantInternalId);

  return insights;
}

/**
 * Asks a natural-language question about a plant's care, answered by AI using action logs
 * @param {string} plantUUID - Plant's UUID
 * @param {string} question - Natural-language question
 * @returns {Promise<object>} AI-generated answer
 * @throws {RouteError} 400 if question is empty
 * @throws {RouteError} 404 if care state not found
 */
export async function askQuestion(plantUUID, question) {
  // 1. Validate question
  if (!question) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Question is required");
  }

  // 2. Fetch care state
  const careState = await plantCareStateService.getByPlantUUID(plantUUID);
  if (!careState) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Care state not found");
  }

  // 3. Fetch recent action logs
  const actionLogs = await plantCareActionLogger.paginateActionLogs(plantUUID, { page: 1, limit: 100 });
  // 4. Ask AI with context
  return await plantCareAiInsights.answerQuestion(
    plantUUID,
    question,
    actionLogs.logs || [],
  );
}
