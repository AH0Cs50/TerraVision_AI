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

export async function getCareState(plantUUID) {
  const careState = await plantCareStateService.getByPlantUUID(plantUUID);
  if (!careState) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Care state not found");
  }
  return careState;
}

// ── Action Logs ────────────────────────────────

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

export async function addActionLog(plantUUID, user, { actionType, description, metadata } = {}) {
  if (!actionType || !description) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "actionType and description are required");
  }

  const userInternalId = user.internalId || (await userRepo.findByUUID(user.uuid)).internalId;
  const plantInternalId = await plantService.getInternalId(plantUUID);

  return await plantCareActionLogger.addActionLog(plantUUID, user.uuid, userInternalId, plantInternalId, {
    actionType,
    description,
    metadata,
  });
}

export async function clearOldLogs(plantUUID, before) {
  const date = before ? new Date(before) : new Date();
  const result = await plantCareActionLogger.clearOldLogs(plantUUID, date);

  if (!result) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Care state not found");
  }

  return result;
}

// ── Tasks ──────────────────────────────────────

export async function getTasks(plantUUID, page = 1, limit = 20) {
  const result = await plantTaskCareManager.paginateTasks(plantUUID, { type: 0, page, limit });
  return result.tasks || [];
}

export async function getOverdueTasks(plantUUID) {
  return await plantTaskCareManager.getOverdueTasks(plantUUID);
}

export async function getPendingTasks(plantUUID) {
  return await plantTaskCareManager.getPendingTasks(plantUUID);
}

export async function getPrioritizedTasks(plantUUID) {
  return await plantTaskCareManager.prioritizeTasks(plantUUID);
}

// ── AI Insights ────────────────────────────────

export async function generateAiInsights(plantUUID, user) {
  const careState = await plantCareStateService.getByPlantUUID(plantUUID);
  if (!careState) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Care state not found");
  }

  const actionLogs = await plantCareActionLogger.paginateActionLogs(plantUUID, { page: 1, limit: 100 });
  const insights = await plantCareAiInsights.generateInsights(
    plantUUID,
    careState.status,
    actionLogs.logs || [],
  );

  const userInternalId = user.internalId || (await userRepo.findByUUID(user.uuid)).internalId;
  const plantInternalId = await plantService.getInternalId(plantUUID);
  await plantCareActionLogger.logInsightGenerated(plantUUID, user.uuid, userInternalId, plantInternalId);

  return insights;
}

export async function askQuestion(plantUUID, question) {
  if (!question) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Question is required");
  }

  const careState = await plantCareStateService.getByPlantUUID(plantUUID);
  if (!careState) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Care state not found");
  }

  const actionLogs = await plantCareActionLogger.paginateActionLogs(plantUUID, { page: 1, limit: 100 });
  return await plantCareAiInsights.answerQuestion(
    plantUUID,
    question,
    actionLogs.logs || [],
  );
}
