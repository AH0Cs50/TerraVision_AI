export class PlantCareActionService {
  constructor(plantAnalyserService, plantCareStateService, plantTaskCareManager, plantCareAiInsights, actionLogger) {
    this.plantAnalyserService = plantAnalyserService;
    this.plantCareStateService = plantCareStateService;
    this.plantTaskCareManager = plantTaskCareManager;
    this.plantCareAiInsights = plantCareAiInsights;
    this.actionLogger = actionLogger;
  }

  async performAction(plantUUID, taskType, user, actionFn, actionLog = null) {
    const errors = [];

    try {
      await actionFn();
    } catch (e) {
      errors.push(`Action failed: ${e.message}`);
    }

    try {
      const careState = await this.plantCareStateService.getByPlantUUID(plantUUID);
      const task = (careState?.activeTasks || []).find((t) => t.type === taskType);
      if (task) {
        await this.plantTaskCareManager.completeTask(plantUUID, task.taskId, user, { archive: true });
      }
    } catch (e) {
      errors.push(`Auto-complete task failed: ${e.message}`);
    }

    if (actionLog) {
      try {
        await this.actionLogger.addActionLog(plantUUID, user, actionLog);
      } catch (e) {
        errors.push(`Action log failed: ${e.message}`);
      }
    }

    let status = {};
    let aiInsights = {};
    let activeTasks = [];

    try {
      const engineResult = await this.plantAnalyserService.analyzePlant(plantUUID, user.uuid);
      const updated = await this.plantCareStateService.saveEngineOutput(plantUUID, engineResult);
      status = updated.status || {};
      activeTasks = updated.activeTasks || [];

      const allOptimal =
        status.water === "satisfied" &&
        status.nutrients === "optimal" &&
        status.health === "healthy" &&
        status.light === "optimal";

      if (!allOptimal) {
        const result = await this.plantTaskCareManager.generateTasksFromStatus(plantUUID, user);
        if (result?.tasks) {
          activeTasks = [...activeTasks, ...result.tasks];
        }
      }

      const logs = await this.actionLogger.paginateActionLogs(plantUUID, { page: 1, limit: 100 });
      const insights = await this.plantCareAiInsights.generateInsights(plantUUID, status, logs.logs || []);
      if (insights.summary) {
        await this.plantCareStateService.updateByPlantUUID(plantUUID, { aiInsights: insights });
        aiInsights = insights;
      }
    } catch (e) {
      errors.push(`Analysis or insight generation failed: ${e.message}`);
    }

    return { status, aiInsights, activeTasks };
  }
}
