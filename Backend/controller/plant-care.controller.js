import {
  plantAnalyserService,
  plantService,
  plantCareStateService,
  plantCareActionLogger,
  plantTaskCareManager,
  plantCareAiInsights,
} from "../shared/container.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

export async function analyzePlant(req, res, next) {
  try {
    const { id } = req.params;

    await plantService.verifyPlantAccess(id, req.user.uuid, req.user.role);

    const engineResult = await plantAnalyserService.analyzePlant(id, req.user.uuid);

    const careState = await plantCareStateService.saveEngineOutput(id, engineResult);

    await plantCareActionLogger.logTaskCompleted(
      id,
      "Plant analysis completed",
      { method: "analyze", engineResult },
    );

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Plant analysis completed",
      data: careState,
    });
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
        .json({ message: "Care state not found" });
    }

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: careState,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecentLogs(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const last = parseInt(req.query.last) || 5;
    const logs = await plantCareActionLogger.getRecentLogs(plantUUID, last);
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: logs,
    });
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
        .json({ message: "actionType and description are required" });
    }

    const log = await plantCareActionLogger.addActionLog(plantUUID, {
      actionType,
      description,
      metadata,
    });

    return res.status(HttpStatusCodes.CREATED).json({
      success: true,
      message: "Action log added",
      data: log,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const tasks = await plantTaskCareManager.getPendingTasks(plantUUID);
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: tasks,
    });
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
        .json({ message: "type and title are required" });
    }

    const result = await plantTaskCareManager.addTaskToPlant(plantUUID, taskData);
    return res.status(HttpStatusCodes.CREATED).json({
      success: true,
      message: "Task added",
      data: result,
    });
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
        .json({ message: "taskId is required" });
    }

    const result = await plantTaskCareManager.completeTask(plantUUID, taskId);
    if (!result) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ message: "Task not found" });
    }

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Task completed",
      data: result,
    });
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
        .json({ message: "Care state not found" });
    }

    const insights = await plantCareAiInsights.generateInsights(
      plantUUID,
      careState.status,
      careState.actionLogs || [],
    );

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "AI insights generated",
      data: insights,
    });
  } catch (error) {
    next(error);
  }
}
