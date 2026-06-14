import * as PlantCare from "../usecases/plant-care.usecase.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import HttpResponse from "../shared/util/HttpResponse.js";

export async function analyzePlant(req, res, next) {
  try {
    const { id } = req.params;
    const result = await PlantCare.analyzeAndSavePlant(id, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Plant analysis completed", { status: result.status }));
  } catch (error) {
    next(error);
  }
}

export async function getCareState(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const careState = await PlantCare.getCareState(plantUUID);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Care state retrieved successfully", careState));
  } catch (error) {
    next(error);
  }
}

export async function getLogs(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { type, page, limit, last } = req.query;
    const result = await PlantCare.getLogs(plantUUID, { type, page, limit, last });

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Logs retrieved successfully", result));
  } catch (error) {
    next(error);
  }
}

export async function addActionLog(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { actionType, description, metadata } = req.body;

    await PlantCare.addActionLog(plantUUID, req.user, { actionType, description, metadata });

    return res.status(HttpStatusCodes.CREATED).json(HttpResponse.success("Action log added", null, HttpStatusCodes.CREATED));
  } catch (error) {
    next(error);
  }
}

export async function getTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await PlantCare.getTasks(plantUUID, page, limit);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Tasks retrieved successfully", result));
  } catch (error) {
    next(error);
  }
}

export async function generateAiInsights(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const insights = await PlantCare.generateAiInsights(plantUUID, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("AI insights generated", insights));
  } catch (error) {
    next(error);
  }
}

export async function waterPlant(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const result = await PlantCare.waterPlant(plantUUID, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Plant watered", result));
  } catch (error) {
    next(error);
  }
}

export async function fertilizePlant(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const result = await PlantCare.fertilizePlant(plantUUID, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Plant fertilized", result));
  } catch (error) {
    next(error);
  }
}

export async function harvestPlant(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const result = await PlantCare.harvestPlant(plantUUID, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Plant harvested", result));
  } catch (error) {
    next(error);
  }
}

export async function updateLight(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { lightCondition } = req.body;
    const result = await PlantCare.updateLight(plantUUID, req.user, lightCondition);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Light condition updated", result));
  } catch (error) {
    next(error);
  }
}

export async function treatDisease(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const result = await PlantCare.treatDisease(plantUUID, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Disease treated", result));
  } catch (error) {
    next(error);
  }
}

export async function prunePlant(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const result = await PlantCare.prunePlant(plantUUID, req.user);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Plant pruned", result));
  } catch (error) {
    next(error);
  }
}

export async function getOverdueTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const tasks = await PlantCare.getOverdueTasks(plantUUID);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Overdue tasks retrieved", tasks));
  } catch (error) {
    next(error);
  }
}

export async function getPendingTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const tasks = await PlantCare.getPendingTasks(plantUUID);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Pending tasks retrieved", tasks));
  } catch (error) {
    next(error);
  }
}

export async function getPrioritizedTasks(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const tasks = await PlantCare.getPrioritizedTasks(plantUUID);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Prioritized tasks retrieved", tasks));
  } catch (error) {
    next(error);
  }
}

export async function clearOldLogs(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { before } = req.query;
    const result = await PlantCare.clearOldLogs(plantUUID, before);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Old logs cleared", result));
  } catch (error) {
    next(error);
  }
}

export async function askQuestion(req, res, next) {
  try {
    const plantUUID = req.params.id;
    const { question } = req.body;
    const answer = await PlantCare.askQuestion(plantUUID, question);

    return res.status(HttpStatusCodes.OK).json(HttpResponse.success("Question answered", answer));
  } catch (error) {
    next(error);
  }
}
