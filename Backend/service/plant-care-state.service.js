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

/**
 * @description CRUD service for plant care state documents. Each plant has
 * one care state containing current status (water, nutrients, health, light),
 * engine scores, active/completed tasks, and action logs.
 */
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
  /**
   * @description Accepts raw engine output, maps numeric scores to categorical
   * status values, and creates or updates the care state for the plant.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} engineResult - Raw output from the analysis engine
   * @returns {Promise<Object>} Created or updated care state document
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

/**
 * @description Manages the task lifecycle for a plant's care state: adding,
 * completing, cancelling, and reopening tasks. Also supports overdue detection,
 * prioritization, pagination, and AI-driven task generation from status.
 */
export class PlantTaskCareManager {
  constructor(plantCareStateRepo, taskGenerator, actionLogger) {
    this.repo = plantCareStateRepo;
    this.taskGenerator = taskGenerator;
    this.actionLogger = actionLogger;
  }

  /**
   * @description Adds a new task to the plant's active task list.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} taskData - Task properties (type, title, description, priority, etc.)
   * @returns {Promise<Object>} Updated care state
   */
  async addTaskToPlant(plantUUID, taskData) {
    const task = createPlantTaskModel({ ...taskData, createdAt: new Date() });
    return await this.repo.pushToActive(plantUUID, task);
  }

  /**
   * @description Moves a task from active to completed, records completion
   * timestamp, and logs the event.
   * @param {string} plantUUID - UUID of the plant
   * @param {string} taskId - ID of the task to complete
   * @returns {Promise<Object|null>} Updated care state, or null if task not found
   */
  async completeTask(plantUUID, taskId, user = null) {
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
      user,
      `Task "${completedTask.title}" completed`,
      { taskId, taskType: completedTask.type },
    );

    return await this.repo.findByPlantUUID(plantUUID);
  }

  /**
   * @description Removes a task from active without marking it completed,
   * and logs the cancellation.
   * @param {string} plantUUID - UUID of the plant
   * @param {string} taskId - ID of the task to cancel
   * @returns {Promise<Object|null>} Updated care state, or null if not found
   */
  async cancelTask(plantUUID, taskId, user = null) {
    const found = await this.repo.findTaskInActive(plantUUID, taskId);
    if (!found) return null;

    await this.repo.removeFromActive(plantUUID, taskId);

    await this.actionLogger.logTaskCompleted(
      plantUUID,
      user,
      `Task "${found.task.title}" cancelled`,
      { taskId, taskType: found.task.type, cancelled: true },
    );

    return await this.repo.findByPlantUUID(plantUUID);
  }

  /**
   * @description Moves a previously completed task back to active with
   * status "pending" and clears its completion timestamp.
   * @param {string} plantUUID - UUID of the plant
   * @param {string} taskId - ID of the task to reopen
   * @returns {Promise<Object|null>} Updated care state, or null if not found
   */
  async reopenTask(plantUUID, taskId, user = null) {
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
      user,
      `Task "${reopenedTask.title}" reopened`,
      { taskId, taskType: reopenedTask.type, reopened: true },
    );

    return await this.repo.findByPlantUUID(plantUUID);
  }

  /**
   * Reads current status + engine scores from the care state,
   * calls the LLM task generator, and pushes each generated task to activeTasks.
   */
  /**
   * @description Reads the current care state, calls the LLM task generator,
   * and pushes each generated task to the active task list.
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<Object|null>} Updated care state, or null if no state exists
   */
  async generateTasksFromStatus(plantUUID, user = null) {
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
      user,
      `${tasks.length} task(s) generated from status`,
      { count: tasks.length, generatedBy: "ai" },
    );

    return await this.repo.findByPlantUUID(plantUUID);
  }

  /**
   * @description Returns all active tasks whose due date has passed.
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<Array>} Array of overdue task objects
   */
  async getOverdueTasks(plantUUID) {
    const careState = await this.repo.findByPlantUUID(plantUUID);
    if (!careState) return [];

    const now = new Date();
    return (careState.activeTasks || []).filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "completed",
    );
  }

  /**
   * @description Returns all active tasks that are still pending or in progress.
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<Array>} Array of pending/in-progress task objects
   */
  async getPendingTasks(plantUUID) {
    const careState = await this.repo.findByPlantUUID(plantUUID);
    if (!careState) return [];

    return (careState.activeTasks || []).filter(
      (t) => t.status === "pending" || t.status === "in_progress",
    );
  }

  /**
   * @description Returns active tasks sorted by priority (high > medium > low).
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<Array>} Sorted array of tasks
   */
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
  /**
   * @description Finds completed tasks still in the active list, moves them
   * to completedTasks, and logs the archival.
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<Object|null>} Updated care state, or null if not found
   */
  async removeCompletedTasks(plantUUID, user = null) {
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
        user,
        `${completedInActive.length} completed task(s) moved to archive`,
        { count: completedInActive.length },
      );
    }

    return await this.repo.findByPlantUUID(plantUUID);
  }
}

/**
 * @description Provides structured action logging for plant care events.
 * Stores each action as an independent document in the ActionLog collection.
 * Resolves plantInternalId and userInternalId at write time for fast indexed
 * queries without joins.
 */
export class PlantCareActionLogger {
  constructor(actionLogRepo, plantService) {
    this.actionLogRepo = actionLogRepo;
    this.plantService = plantService;
  }

  async #log(plantUUID, user, actionType, description, metadata) {
    const plantInternalId = await this.plantService.getInternalId(plantUUID);
    await this.actionLogRepo.create({
      plantUUID,
      plantInternalId,
      userUUID: user.uuid,
      userInternalId: await this.#resolveUserInternalId(user),
      actionType,
      description,
      metadata,
    });
  }

  async #resolveUserInternalId(user) {
    if (user.internalId) return user.internalId;
    const userDoc = await this.plantService.userService?.findByUUID?.(user.uuid);
    return userDoc?.internalId;
  }

  /**
   * @description Appends a generic action log entry.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid (and optionally internalId)
   * @param {Object} [logData]
   * @param {string} logData.actionType - One of ACTION_TYPES
   * @param {string} logData.description - Human-readable description
   * @param {Object} [logData.metadata] - Arbitrary extra data
   */
  async addActionLog(plantUUID, user, { actionType, description, metadata } = {}) {
    await this.#log(plantUUID, user, actionType, description, metadata);
  }

  /**
   * @description Logs a watering event for the plant.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Plant watered"]
   * @param {Object} [metadata]
   */
  async logWatering(plantUUID, user, description = "Plant watered", metadata) {
    await this.#log(plantUUID, user, "watered", description, metadata);
  }

  /**
   * @description Logs a fertilizing event for the plant.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Plant fertilized"]
   * @param {Object} [metadata]
   */
  async logFertilizing(plantUUID, user, description = "Plant fertilized", metadata) {
    await this.#log(plantUUID, user, "fertilized", description, metadata);
  }

  /**
   * @description Logs a harvesting event for the plant.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Plant harvested"]
   * @param {Object} [metadata]
   */
  async logHarvest(plantUUID, user, description = "Plant harvested", metadata) {
    await this.#log(plantUUID, user, "harvested", description, metadata);
  }

  /**
   * @description Logs a disease scan event for the plant.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Disease scan performed"]
   * @param {Object} [metadata]
   */
  async logDiseaseScan(plantUUID, user, description = "Disease scan performed", metadata) {
    await this.#log(plantUUID, user, "disease_scan", description, metadata);
  }

  /**
   * @description Logs a light condition change event for the plant.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Light conditions changed"]
   * @param {Object} [metadata]
   */
  async logLightChanged(plantUUID, user, description = "Light conditions changed", metadata) {
    await this.#log(plantUUID, user, "light_changed", description, metadata);
  }

  /**
   * @description Logs a task completion event.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Task completed"]
   * @param {Object} [metadata]
   */
  async logTaskCompleted(plantUUID, user, description = "Task completed", metadata) {
    await this.#log(plantUUID, user, "task_completed", description, metadata);
  }

  /**
   * @description Logs a task-added event.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Task added"]
   * @param {Object} [metadata]
   */
  async logTaskAdded(plantUUID, user, description = "Task added", metadata) {
    await this.#log(plantUUID, user, "task_added", description, metadata);
  }

  /**
   * @description Logs a plant-created event.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Plant created"]
   * @param {Object} [metadata]
   */
  async logPlantCreated(plantUUID, user, description = "Plant created", metadata) {
    await this.#log(plantUUID, user, "plant_created", description, metadata);
  }

  /**
   * @description Logs a plant-updated event.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Plant updated"]
   * @param {Object} [metadata]
   */
  async logPlantUpdated(plantUUID, user, description = "Plant updated", metadata) {
    await this.#log(plantUUID, user, "plant_updated", description, metadata);
  }

  /**
   * @description Logs a plant-deleted event.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Plant deleted"]
   * @param {Object} [metadata]
   */
  async logPlantDeleted(plantUUID, user, description = "Plant deleted", metadata) {
    await this.#log(plantUUID, user, "plant_deleted", description, metadata);
  }

  /**
   * @description Logs an image-uploaded event.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Image uploaded"]
   * @param {Object} [metadata]
   */
  async logImageUploaded(plantUUID, user, description = "Image uploaded", metadata) {
    await this.#log(plantUUID, user, "image_uploaded", description, metadata);
  }

  /**
   * @description Logs an image-removed event.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Image removed"]
   * @param {Object} [metadata]
   */
  async logImageRemoved(plantUUID, user, description = "Image removed", metadata) {
    await this.#log(plantUUID, user, "image_removed", description, metadata);
  }

  /**
   * @description Logs a disease-detected event.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Disease detected"]
   * @param {Object} [metadata]
   */
  async logDiseaseDetected(plantUUID, user, description = "Disease detected", metadata) {
    await this.#log(plantUUID, user, "disease_detected", description, metadata);
  }

  /**
   * @description Logs a plant-data-extracted event.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="Plant data extracted from image"]
   * @param {Object} [metadata]
   */
  async logPlantDataExtracted(plantUUID, user, description = "Plant data extracted from image", metadata) {
    await this.#log(plantUUID, user, "plant_data_extracted", description, metadata);
  }

  /**
   * @description Logs an insight-generated event.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} user - User object with uuid
   * @param {string} [description="AI insight generated"]
   * @param {Object} [metadata]
   */
  async logInsightGenerated(plantUUID, user, description = "AI insight generated", metadata) {
    await this.#log(plantUUID, user, "insight_generated", description, metadata);
  }

  /**
   * @description Returns the most recent N action logs for the plant.
   * @param {string} plantUUID - UUID of the plant
   * @param {number} [last=5] - Number of recent logs to retrieve
   * @returns {Promise<Array>} Array of log entries
   */
  async getRecentLogs(plantUUID, last = 5) {
    return await this.actionLogRepo.getRecent(plantUUID, last);
  }

  /**
   * @description Returns action logs filtered by a specific action type.
   * @param {string} plantUUID - UUID of the plant
   * @param {string} actionType - The action type to filter by
   * @returns {Promise<Array>} Matching log entries
   */
  async getLogsByType(plantUUID, actionType) {
    const result = await this.actionLogRepo.findByPlantUUID(plantUUID, { page: 1, limit: 1000 });
    return (result.logs || []).filter((l) => l.actionType === actionType);
  }

  /**
   * @description Paginates through all action logs for a plant.
   * @param {string} plantUUID - UUID of the plant
   * @param {Object} [options]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @returns {Promise<Object>} Paginated result
   */
  async paginateActionLogs(plantUUID, { page = 1, limit = 20 } = {}) {
    return await this.actionLogRepo.findByPlantUUID(plantUUID, { page, limit });
  }

  /**
   * @description Removes all action logs older than the given date.
   * @param {string} plantUUID - UUID of the plant
   * @param {Date} [date] - cutoff; defaults to now (clears everything)
   * @returns {Promise<number>} Number of deleted documents
   */
  async clearOldLogs(plantUUID, date = new Date()) {
    return await this.actionLogRepo.deleteOlderThan(plantUUID, date);
  }
}

/**
 * @description Uses the LLM to generate care tasks based on the plant's
 * current status and engine scores. Constructs a prompt with status enums
 * and score values, then parses the model's JSON response into task objects.
 */
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

  /**
   * @private
   * @description Constructs an LLM prompt containing the plant's current
   * status categories, engine scores, and valid enum constraints.
   * @param {Object} status - Current water/nutrients/health/light statuses
   * @param {Object} engineScores - Raw numeric scores from the engine
   * @returns {{contents: Array}} Structured prompt for the LLM
   */
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

  /**
   * @private
   * @description Extracts a JSON array from the LLM response, validates it,
   * and maps each item to a PlantTaskModel.
   * @param {Object|string} response - Raw LLM response
   * @returns {Array<Object>} Array of parsed task objects
   */
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

/**
 * @description Generates AI-powered insights and answers for plant care.
 * Uses the LLM to produce human-readable summaries based on current status
 * and action history.
 */
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

  /**
   * @private
   * @description Builds a prompt for the LLM to generate care insights
   * from current status and recent action logs.
   * @param {Object} status - Current care status
   * @param {Array} actionLogs - Plant action history
   * @returns {{contents: Array}} Structured prompt
   */
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

  /**
   * @private
   * @description Builds a prompt for answering a free-text user question
   * about the plant based on recent action history.
   * @param {string} question - User's question
   * @param {Array} actionLogs - Plant action history
   * @returns {{contents: Array}} Structured prompt
   */
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

  /**
   * @private
   * @description Extracts a JSON object from the LLM response with summary
   * and recommendations fields.
   * @param {Object|string} response - Raw LLM response
   * @returns {{summary: string, recommendations: Array, generatedAt: Date}}
   */
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
