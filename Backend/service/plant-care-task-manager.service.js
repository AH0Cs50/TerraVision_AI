import { createPlantTaskModel } from "../model/plant-care.model.js";

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
    const careState = await this.repo.pushToActive(plantUUID, task);
    return { task, activeTasks: careState.activeTasks };
  }

  /**
   * @description Moves a task from active to completed, records completion
   * timestamp, and logs the event. When archive is true, the task is removed
   * from active without being pushed to completed (auto-archive).
   * @param {string} plantUUID - UUID of the plant
   * @param {string} taskId - ID of the task to complete
   * @param {Object} [user=null] - User object with uuid
   * @param {Object} [options={}]
   * @param {boolean} [options.archive=false] - Skip push to completed
   * @returns {Promise<Object|null>} Updated care state, or null if task not found
   */
  async completeTask(plantUUID, taskId, user = null, { archive = false } = {}) {
    const found = await this.repo.findTaskInActive(plantUUID, taskId);
    if (!found) return null;

    const completedTask = {
      ...found.task,
      status: "completed",
      completedAt: new Date(),
    };

    await this.repo.removeFromActive(plantUUID, taskId);

    if (!archive) {
      await this.repo.pushToCompleted(plantUUID, completedTask);
    }

    await this.actionLogger.logTaskCompleted(
      plantUUID,
      user,
      `Task "${completedTask.title}" completed`,
      { taskId, taskType: completedTask.type, archived: archive },
    );

    const updated = await this.repo.findByPlantUUID(plantUUID);
    return { task: completedTask, activeTasks: updated.activeTasks, completedTasks: updated.completedTasks };
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

    const updated = await this.repo.findByPlantUUID(plantUUID);
    return { task: found.task, activeTasks: updated.activeTasks };
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

    const updated = await this.repo.findByPlantUUID(plantUUID);
    return { task: reopenedTask, activeTasks: updated.activeTasks, completedTasks: updated.completedTasks };
  }

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

    const updated = await this.repo.findByPlantUUID(plantUUID);
    return { tasks, status: updated.status };
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

    const updated = await this.repo.findByPlantUUID(plantUUID);
    return { completedTasks: updated.completedTasks };
  }
}
