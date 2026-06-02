import { fillPrompt } from "./llm.service.js";

import {
  engineScoresToStatus,
  buildEngineScores,
  createPlantTaskModel,
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_GENERATED_BY,
  ACTION_TYPES,
  WATER_STATUSES,
  NUTRIENT_STATUSES,
  HEALTH_STATUSES,
  LIGHT_STATUSES,
} from "../model/plant-care.model.js";

// ── MAIN SERVICE ────────────────────────────────

class PlantCareStateService {
  constructor(plantCareStateRepository) {
    this.repo = plantCareStateRepository;
  }

  async create(data) {
    return await this.repo.create(data);
  }

  async getByUUID(uuid) {
    return await this.repo.findByUUID(uuid);
  }

  async getByInternalId(internalId) {
    return await this.repo.findByInternalId(internalId);
  }

  async getByPlantUUID(plantUUID) {
    return await this.repo.findByPlantUUID(plantUUID);
  }

  async updateByUUID(uuid, data) {
    return await this.repo.updateByUUID(uuid, data);
  }

  async updateByPlantUUID(plantUUID, data) {
    return await this.repo.updateByPlantUUID(plantUUID, data);
  }

  async deleteByUUID(uuid) {
    return await this.repo.deleteByUUID(uuid);
  }

  async deleteByPlantUUID(plantUUID) {
    return await this.repo.deleteByPlantUUID(plantUUID);
  }

  async paginateAll({ page, limit } = {}) {
    return await this.repo.paginate({ page, limit });
  }

  /**
   * Accepts raw engine output, maps numeric scores → categorical status,
   * then creates a new care state or updates the existing one for this plant.
   */
  async saveEngineOutput(plantUUID, engineResult) {
    const scores = buildEngineScores(engineResult);
    const status = engineScoresToStatus(scores);

    const existing = await this.repo.findByPlantUUID(plantUUID);
    if (existing) {
      return await this.repo.updateByPlantUUID(plantUUID, {
        status,
        engineScores: scores,
      });
    }

    return await this.repo.create({
      plantUUID,
      status,
      engineScores: scores,
      activeTasks: [],
      completedTasks: [],
      actionLogs: [],
      updatedAt: new Date(),
    });
  }
}

export default PlantCareStateService;

// ── TASK MANAGEMENT ─────────────────────────────

export class PlantTaskCareManager {
  constructor(plantCareStateRepo, taskGenerator, actionLogger) {
    this.repo = plantCareStateRepo;
    this.taskGenerator = taskGenerator;
    this.actionLogger = actionLogger;
  }

  async addTaskToPlant(plantUUID, taskData) {
    const task = createPlantTaskModel({ ...taskData, createdAt: new Date() });
    return await this.repo.pushToActive(plantUUID, task);
  }

  async completeTask(plantUUID, taskId) {
    const found = await this.repo.findTaskInActive(plantUUID, taskId);
    if (!found) return null;

    const completedTask = {
      ...found.task,
      status: "completed",
      completedAt: new Date(),
    };

    await this.repo.removeFromActive(plantUUID, taskId);
    await this.repo.pushToCompleted(plantUUID, completedTask);

    await this.actionLogger.logTaskCompleted(
      plantUUID,
      `Task "${completedTask.title}" completed`,
      { taskId, taskType: completedTask.type },
    );

    return await this.repo.findByPlantUUID(plantUUID);
  }

  async cancelTask(plantUUID, taskId) {
    const found = await this.repo.findTaskInActive(plantUUID, taskId);
    if (!found) return null;

    await this.repo.removeFromActive(plantUUID, taskId);

    await this.actionLogger.logTaskCompleted(
      plantUUID,
      `Task "${found.task.title}" cancelled`,
      { taskId, taskType: found.task.type, cancelled: true },
    );

    return await this.repo.findByPlantUUID(plantUUID);
  }

  async reopenTask(plantUUID, taskId) {
    const found = await this.repo.findTaskInCompleted(plantUUID, taskId);
    if (!found) return null;

    await this.repo.removeFromCompleted(plantUUID, taskId);

    const reopenedTask = {
      ...found.task,
      status: "pending",
      completedAt: undefined,
    };

    await this.repo.pushToActive(plantUUID, reopenedTask);

    await this.actionLogger.logTaskCompleted(
      plantUUID,
      `Task "${reopenedTask.title}" reopened`,
      { taskId, taskType: reopenedTask.type, reopened: true },
    );

    return await this.repo.findByPlantUUID(plantUUID);
  }

  /**
   * Reads current status + engine scores from the care state,
   * calls the LLM task generator, and pushes each generated task to activeTasks.
   */
  async generateTasksFromStatus(plantUUID) {
    const careState = await this.repo.findByPlantUUID(plantUUID);
    if (!careState) return null;

    const tasks = await this.taskGenerator.generateTasksFromStatus(
      careState.status,
      careState.engineScores,
    );

    for (const task of tasks) {
      await this.repo.pushToActive(plantUUID, task);
    }

    await this.actionLogger.logTaskCompleted(
      plantUUID,
      `${tasks.length} task(s) generated from status`,
      { count: tasks.length, generatedBy: "ai" },
    );

    return await this.repo.findByPlantUUID(plantUUID);
  }

  async getOverdueTasks(plantUUID) {
    const careState = await this.repo.findByPlantUUID(plantUUID);
    if (!careState) return [];

    const now = new Date();
    return (careState.activeTasks || []).filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "completed",
    );
  }

  async getPendingTasks(plantUUID) {
    const careState = await this.repo.findByPlantUUID(plantUUID);
    if (!careState) return [];

    return (careState.activeTasks || []).filter(
      (t) => t.status === "pending" || t.status === "in_progress",
    );
  }

  async prioritizeTasks(plantUUID) {
    const careState = await this.repo.findByPlantUUID(plantUUID);
    if (!careState) return [];

    const priorityWeight = { high: 3, medium: 2, low: 1 };

    return [...(careState.activeTasks || [])].sort(
      (a, b) =>
        (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0),
    );
  }

  /**
   * @param {number} type - 0=all, 1=active, 2=completed
   */
  async paginateTasks(plantUUID, { type = 0, page, limit } = {}) {
    return await this.repo.paginateTasks(plantUUID, { type, page, limit });
  }

  /**
   * Finds all tasks with status "completed" still in the activeTasks array,
   * moves them to completedTasks, and logs the operation.
   */
  async removeCompletedTasks(plantUUID) {
    const careState = await this.repo.findByPlantUUID(plantUUID);
    if (!careState) return null;

    const now = new Date();
    const completedInActive = (careState.activeTasks || []).filter(
      (t) => t.status === "completed",
    );

    for (const task of completedInActive) {
      await this.repo.removeFromActive(plantUUID, task.taskId);

      const moved = { ...task, completedAt: task.completedAt || now };
      await this.repo.pushToCompleted(plantUUID, moved);
    }

    if (completedInActive.length) {
      await this.actionLogger.logTaskCompleted(
        plantUUID,
        `${completedInActive.length} completed task(s) moved to archive`,
        { count: completedInActive.length },
      );
    }

    return await this.repo.findByPlantUUID(plantUUID);
  }
}

// ── ACTION LOGGER ───────────────────────────────

export class PlantCareActionLogger {
  constructor(plantCareStateRepo) {
    this.repo = plantCareStateRepo;
  }

  /**
   * @param {object} logData
   * @param {string} logData.actionType - one of ACTION_TYPES
   * @param {string} logData.description
   * @param {object} [logData.metadata] - arbitrary extra data
   */
  async addActionLog(plantUUID, { actionType, description, metadata } = {}) {
    const log = {
      logId: undefined,
      actionType,
      description,
      metadata,
      createdAt: new Date(),
    };

    return await this.repo.pushActionLog(plantUUID, log);
  }

  async logWatering(plantUUID, description = "Plant watered", metadata) {
    return await this.addActionLog(plantUUID, {
      actionType: "watered",
      description,
      metadata,
    });
  }

  async logFertilizing(plantUUID, description = "Plant fertilized", metadata) {
    return await this.addActionLog(plantUUID, {
      actionType: "fertilized",
      description,
      metadata,
    });
  }

  async logHarvest(plantUUID, description = "Plant harvested", metadata) {
    return await this.addActionLog(plantUUID, {
      actionType: "harvested",
      description,
      metadata,
    });
  }

  async logDiseaseScan(
    plantUUID,
    description = "Disease scan performed",
    metadata,
  ) {
    return await this.addActionLog(plantUUID, {
      actionType: "disease_scan",
      description,
      metadata,
    });
  }

  async logLightChanged(
    plantUUID,
    description = "Light conditions changed",
    metadata,
  ) {
    return await this.addActionLog(plantUUID, {
      actionType: "light_changed",
      description,
      metadata,
    });
  }

  async logTaskCompleted(plantUUID, description = "Task completed", metadata) {
    return await this.addActionLog(plantUUID, {
      actionType: "task_completed",
      description,
      metadata,
    });
  }

  async getRecentLogs(plantUUID, last = 5) {
    const careState = await this.repo.findByPlantUUID(plantUUID);
    if (!careState) return [];

    const logs = careState.actionLogs || [];
    return logs.slice(-last);
  }

  async getLogsByType(plantUUID, actionType) {
    const careState = await this.repo.findByPlantUUID(plantUUID);
    if (!careState) return [];

    return (careState.actionLogs || []).filter(
      (l) => l.actionType === actionType,
    );
  }

  async paginateActionLogs(plantUUID, { page, limit } = {}) {
    return await this.repo.paginateActionLogs(plantUUID, { page, limit });
  }

  /**
   * Removes all action logs older than the given date.
   * @param {Date} [date] - cutoff; defaults to now (clears everything)
   */
  async clearOldLogs(plantUUID, date = new Date()) {
    const careState = await this.repo.findByPlantUUID(plantUUID);
    if (!careState) return null;

    const cutoff = new Date(date);
    const remaining = (careState.actionLogs || []).filter(
      (l) => new Date(l.createdAt) >= cutoff,
    );

    return await this.repo.updateByPlantUUID(plantUUID, {
      actionLogs: remaining,
    });
  }
}

// ── TASK GENERATOR (LLM-BASED) ──────────────────

export class PlantCareTaskGenerator {
  constructor(llmService) {
    this.llmService = llmService;
  }

  /**
   * Calls the LLM with current status + engine scores to produce care tasks.
   * Returns an array of parsed task objects matching PlantTaskSchema.
   */
  async generateTasksFromStatus(status, engineScores) {
    try {
      const prompt = this.#buildPrompt(status, engineScores);
      const response = await this.llmService.generateResponse(prompt);
      return this.#parseTasks(response);
    } catch {
      return [];
    }
  }

  #buildPrompt(status, engineScores) {
    const enumConstraints = `
- task type: one of ${JSON.stringify(TASK_TYPES)}
- priority: one of ${JSON.stringify(TASK_PRIORITIES)}
- status: must be "pending"
- generatedBy: must be "ai"
`;

    const text = fillPrompt("TASK_GENERATION", {
      enumConstraints: enumConstraints.trimEnd(),
      waterStatus: status.water,
      waterStatuses: JSON.stringify(WATER_STATUSES),
      nutrientStatus: status.nutrients,
      nutrientStatuses: JSON.stringify(NUTRIENT_STATUSES),
      healthStatus: status.health,
      healthStatuses: JSON.stringify(HEALTH_STATUSES),
      lightStatus: status.light,
      lightStatuses: JSON.stringify(LIGHT_STATUSES),
      waterScore: engineScores?.waterScore,
      fertilizerScore: engineScores?.fertilizerScore,
      pestRiskScore: engineScores?.pestRiskScore,
      lightScore: engineScores?.lightScore,
    });

    return {
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
    };
  }

  #parseTasks(response) {
    try {
      let text =
        typeof response === "string"
          ? response
          : response?.text ||
            response?.candidates?.[0]?.content?.parts?.[0]?.text ||
            JSON.stringify(response);

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      const tasks = JSON.parse(text);
      if (!Array.isArray(tasks)) return [];

      return tasks.map((t) =>
        createPlantTaskModel({
          type: t.type,
          title: t.title,
          description: t.description,
          priority: t.priority || "medium",
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          createdAt: new Date(),
        }),
      );
    } catch {
      return [];
    }
  }
}

// ── AI INSIGHTS ─────────────────────────────────

export class PlantCareAiInsights {
  constructor(llmService) {
    this.llmService = llmService;
  }

  /**
   * Generates a summary + recommendations from current status and care history.
   */
  async generateInsights(plantUUID, status, actionLogs) {
    try {
      const prompt = this.#buildInsightPrompt(status, actionLogs);
      const response = await this.llmService.generateResponse(prompt);
      return this.#parseInsights(response);
    } catch {
      return { summary: "", recommendations: [], generatedAt: new Date() };
    }
  }

  /**
   * Answers a free-text user question about the plant's care based on history.
   */
  async answerQuestion(plantUUID, question, actionLogs) {
    try {
      const prompt = this.#buildQuestionPrompt(question, actionLogs);
      const response = await this.llmService.generateResponse(prompt);
      return this.#parseInsights(response);
    } catch {
      return { summary: "", recommendations: [], generatedAt: new Date() };
    }
  }

  #buildInsightPrompt(status, actionLogs) {
    const s = status || {};
    const recentLogs = (actionLogs || []).slice(-10);
    const logSummary = recentLogs
      .map(
        (l) =>
          `[${new Date(l.createdAt).toISOString()}] ${l.actionType}: ${l.description}`,
      )
      .join("\n");

    const text = fillPrompt("GENERATE_INSIGHT", {
      water: s.water,
      nutrients: s.nutrients,
      health: s.health,
      light: s.light,
      logSummary: logSummary || "No recent actions recorded.",
    });

    return {
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
    };
  }

  #buildQuestionPrompt(question, actionLogs) {
    const recentLogs = (actionLogs || []).slice(-10);
    const logSummary = recentLogs
      .map(
        (l) =>
          `[${new Date(l.createdAt).toISOString()}] ${l.actionType}: ${l.description}`,
      )
      .join("\n");

    const text = fillPrompt("ANSWER_QUESTION", {
      logSummary: logSummary || "No recent actions recorded.",
      question,
    });

    return {
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
    };
  }

  #parseInsights(response) {
    try {
      let text =
        typeof response === "string"
          ? response
          : response?.text ||
            response?.candidates?.[0]?.content?.parts?.[0]?.text ||
            JSON.stringify(response);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || "",
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
        generatedAt: new Date(),
      };
    } catch {
      return {
        summary: "",
        recommendations: [],
        generatedAt: new Date(),
      };
    }
  }
}
