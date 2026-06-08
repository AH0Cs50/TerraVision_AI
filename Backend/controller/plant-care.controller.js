import {
  plantAnalyserService,
  plantService,
  plantCareStateService,
  plantCareActionLogger,
  plantTaskCareManager,
  plantCareAiInsights,
  actionLogRepo,
} from "../shared/container.js";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import HttpResponse from "../shared/util/HttpResponse.js";

export async function analyzePlant(req, res, next) {
  try {
    const { id } = req.params;

    await plantService.verifyPlantAccess(id, req.user.uuid, req.user.role);

    const engineResult = await plantAnalyserService.analyzePlant(id, req.user.uuid);

    const careState = await plantCareStateService.saveEngineOutput(id, engineResult);

    await plantCareActionLogger.logDiseaseScan(
      id,
      req.user,
      "Plant analysis completed",
      { method: "analyze", engineResult },
    );

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Plant analysis completed", { status: careState.status }));
  } catch (error) {
    next(error);
  }
}

export async function getCareState(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const careState = await plantCareStateService.getByPlantUUID(plantUUID);

    if (!careState) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json(HttpResponse.error("Care state not found", HttpStatusCodes.NOT_FOUND));
    }

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Care state retrieved successfully", careState));
  } catch (error) {
    next(error);
  }
}

export async function getLogs(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { type, page, limit, last } = req.query;

    if (type) {
      const logs = await plantCareActionLogger.getLogsByType(plantUUID, type);
      return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Logs retrieved successfully", logs));
    }

    if (page) {
      const result = await plantCareActionLogger.paginateActionLogs(plantUUID, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Logs retrieved successfully", result));
    }

    const count = parseInt(last) || 5;
    const logs = await plantCareActionLogger.getRecentLogs(plantUUID, count);
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Logs retrieved successfully", logs));
  } catch (error) {
    next(error);
  }
}

export async function addActionLog(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { actionType, description, metadata } = req.body;

    if (!actionType || !description) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json(HttpResponse.error("actionType and description are required", HttpStatusCodes.BAD_REQUEST));
    }

    const log = await plantCareActionLogger.addActionLog(plantUUID, req.user, {
      actionType,
      description,
      metadata,
    });

    return res.status(HttpStatusCodes.CREATED).json(HttpResponse.success("Action log added", log, HttpStatusCodes.CREATED));
  } catch (error) {
    next(error);
  }
}

export async function getTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await plantTaskCareManager.paginateTasks(plantUUID, { type: 0, page, limit });
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Tasks retrieved successfully", result));
  } catch (error) {
    next(error);
  }
}

export async function addTask(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const taskData = req.body;

    if (!taskData.type || !taskData.title) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json(HttpResponse.error("type and title are required", HttpStatusCodes.BAD_REQUEST));
    }

    const result = await plantTaskCareManager.addTaskToPlant(plantUUID, taskData);

    await plantCareActionLogger.logTaskAdded(plantUUID, req.user, "Task added", { taskType: taskData.type, title: taskData.title });

    return res.status(HttpStatusCodes.CREATED).json(HttpResponse.success("Task added", result.activeTasks, HttpStatusCodes.CREATED));
  } catch (error) {
    next(error);
  }
}

export async function completeTask(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { taskId } = req.body;

    if (!taskId) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json(HttpResponse.error("taskId is required", HttpStatusCodes.BAD_REQUEST));
    }

    const result = await plantTaskCareManager.completeTask(plantUUID, taskId, req.user);
    if (!result) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json(HttpResponse.error("Task not found", HttpStatusCodes.NOT_FOUND));
    }

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Task completed", result));
  } catch (error) {
    next(error);
  }
}

export async function generateAiInsights(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const careState = await plantCareStateService.getByPlantUUID(plantUUID);

    if (!careState) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json(HttpResponse.error("Care state not found", HttpStatusCodes.NOT_FOUND));
    }

    const actionLogs = await actionLogRepo.findByPlantUUID(plantUUID, { page: 1, limit: 100 });
    const insights = await plantCareAiInsights.generateInsights(
      plantUUID,
      careState.status,
      actionLogs.logs || [],
    );

    await plantCareActionLogger.logInsightGenerated(plantUUID, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("AI insights generated", insights));
  } catch (error) {
    next(error);
  }
}

// ── NEW ROUTE HANDLERS ──────────────────────────

export async function waterPlant(req, res, next) {
  try {
    const plantUUID = req.params.id;
    await plantService.verifyPlantAccess(plantUUID, req.user.uuid, req.user.role);

    await plantService.updateWatering(plantUUID, 0);
    await plantCareActionLogger.logWatering(plantUUID, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Plant watered successfully"));
  } catch (error) {
    next(error);
  }
}

export async function fertilizePlant(req, res, next) {
  try {
    const plantUUID = req.params.id;
    await plantService.verifyPlantAccess(plantUUID, req.user.uuid, req.user.role);

    await plantCareActionLogger.logFertilizing(plantUUID, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Plant fertilized"));
  } catch (error) {
    next(error);
  }
}

export async function harvestPlant(req, res, next) {
  try {
    const plantUUID = req.params.id;
    await plantService.verifyPlantAccess(plantUUID, req.user.uuid, req.user.role);

    await plantCareActionLogger.logHarvest(plantUUID, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Plant harvested"));
  } catch (error) {
    next(error);
  }
}

export async function updateLight(req, res, next) {
  try {
    const plantUUID = req.params.id;
    await plantService.verifyPlantAccess(plantUUID, req.user.uuid, req.user.role);

    const { lightCondition } = req.body;
    await plantCareActionLogger.logLightChanged(plantUUID, req.user, "Light conditions changed", { lightCondition });

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Light condition updated"));
  } catch (error) {
    next(error);
  }
}

export async function cancelTask(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { taskId } = req.params;

    const result = await plantTaskCareManager.cancelTask(plantUUID, taskId, req.user);
    if (!result) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(HttpResponse.error("Task not found", HttpStatusCodes.NOT_FOUND));
    }

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Task cancelled", result));
  } catch (error) {
    next(error);
  }
}

export async function reopenTask(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { taskId } = req.params;

    const result = await plantTaskCareManager.reopenTask(plantUUID, taskId, req.user);
    if (!result) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(HttpResponse.error("Task not found", HttpStatusCodes.NOT_FOUND));
    }

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Task reopened", result));
  } catch (error) {
    next(error);
  }
}

export async function generateTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;

    const result = await plantTaskCareManager.generateTasksFromStatus(plantUUID, req.user);
    if (!result) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(HttpResponse.error("Care state not found", HttpStatusCodes.NOT_FOUND));
    }

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Tasks generated from status", result));
  } catch (error) {
    next(error);
  }
}

export async function getOverdueTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const tasks = await plantTaskCareManager.getOverdueTasks(plantUUID);
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Overdue tasks retrieved", tasks));
  } catch (error) {
    next(error);
  }
}

export async function getPendingTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const tasks = await plantTaskCareManager.getPendingTasks(plantUUID);
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Pending tasks retrieved", tasks));
  } catch (error) {
    next(error);
  }
}

export async function getPrioritizedTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const tasks = await plantTaskCareManager.prioritizeTasks(plantUUID);
    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Prioritized tasks retrieved", tasks));
  } catch (error) {
    next(error);
  }
}

export async function removeCompletedTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;

    const result = await plantTaskCareManager.removeCompletedTasks(plantUUID, req.user);
    if (!result) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(HttpResponse.error("Care state not found", HttpStatusCodes.NOT_FOUND));
    }

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Completed tasks archived", result.completedTasks));
  } catch (error) {
    next(error);
  }
}

export async function clearOldLogs(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { before } = req.query;

    const date = before ? new Date(before) : new Date();
    const result = await plantCareActionLogger.clearOldLogs(plantUUID, date);

    if (!result) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(HttpResponse.error("Care state not found", HttpStatusCodes.NOT_FOUND));
    }

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Old logs cleared", result));
  } catch (error) {
    next(error);
  }
}

export async function askQuestion(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { question } = req.body;

    if (!question) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json(HttpResponse.error("Question is required", HttpStatusCodes.BAD_REQUEST));
    }

    const careState = await plantCareStateService.getByPlantUUID(plantUUID);
    if (!careState) {
      return res.status(HttpStatusCodes.NOT_FOUND).json(HttpResponse.error("Care state not found", HttpStatusCodes.NOT_FOUND));
    }

    const actionLogs = await actionLogRepo.findByPlantUUID(plantUUID, { page: 1, limit: 100 });
    const answer = await plantCareAiInsights.answerQuestion(
      plantUUID,
      question,
      actionLogs.logs || [],
    );

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Question answered", answer));
  } catch (error) {
    next(error);
  }
}
