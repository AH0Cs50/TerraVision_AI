import {
  plantAnalyserService,
  plantService,
  plantCareStateService,
  plantCareActionLogger,
  plantTaskCareManager,
  plantCareAiInsights,
} from "../shared/container.js";
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
      "Plant analysis completed",
      { method: "analyze", engineResult },
    );

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Plant analysis completed", careState));
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

export async function getRecentLogs(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const last = parseInt(req.query.last) || 5;
    const logs = await plantCareActionLogger.getRecentLogs(plantUUID, last);
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

    const log = await plantCareActionLogger.addActionLog(plantUUID, {
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
    return res.status(HttpStatusCodes.CREATED).json(HttpResponse.success("Task added", result, HttpStatusCodes.CREATED));
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

    const result = await plantTaskCareManager.completeTask(plantUUID, taskId);
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

    const insights = await plantCareAiInsights.generateInsights(
      plantUUID,
      careState.status,
      careState.actionLogs || [],
    );

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("AI insights generated", insights));
  } catch (error) {
    next(error);
  }
}
