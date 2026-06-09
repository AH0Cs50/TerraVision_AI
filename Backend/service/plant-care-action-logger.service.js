import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

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
    if (plantInternalId === null) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found for logging");
    }

    try {
      await this.actionLogRepo.create({
        plantUUID,
        plantInternalId,
        userUUID: user.uuid,
        userInternalId: await this.#resolveUserInternalId(user),
        actionType,
        description,
        metadata,
      });
    } catch (logError) {
      console.error("Action log failed (non-fatal):", logError.message);
    }
  }

  async #resolveUserInternalId(user) {
    if (user.internalId) return user.internalId;
    const userDoc = await this.plantService.userService.findByUUID(user.uuid);
    return userDoc.internalId;
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

  async logWatering(plantUUID, user, description = "Plant watered", metadata) {
    await this.#log(plantUUID, user, "watered", description, metadata);
  }

  async logFertilizing(plantUUID, user, description = "Plant fertilized", metadata) {
    await this.#log(plantUUID, user, "fertilized", description, metadata);
  }

  async logHarvest(plantUUID, user, description = "Plant harvested", metadata) {
    await this.#log(plantUUID, user, "harvested", description, metadata);
  }

  async logDiseaseScan(plantUUID, user, description = "Disease scan performed", metadata) {
    await this.#log(plantUUID, user, "disease_scan", description, metadata);
  }

  async logPlantAnalysis(plantUUID, user, description = "Plant analysis completed", metadata) {
    await this.#log(plantUUID, user, "plant_analysis", description, metadata);
  }

  async logLightChanged(plantUUID, user, description = "Light conditions changed", metadata) {
    await this.#log(plantUUID, user, "light_changed", description, metadata);
  }

  async logTaskCompleted(plantUUID, user, description = "Task completed", metadata) {
    await this.#log(plantUUID, user, "task_completed", description, metadata);
  }

  async logTaskAdded(plantUUID, user, description = "Task added", metadata) {
    await this.#log(plantUUID, user, "task_added", description, metadata);
  }

  async logPlantCreated(plantUUID, user, description = "Plant created", metadata) {
    await this.#log(plantUUID, user, "plant_created", description, metadata);
  }

  async logPlantUpdated(plantUUID, user, description = "Plant updated", metadata) {
    await this.#log(plantUUID, user, "plant_updated", description, metadata);
  }

  async logPlantDeleted(plantUUID, user, description = "Plant deleted", metadata) {
    await this.#log(plantUUID, user, "plant_deleted", description, metadata);
  }

  async logImageUploaded(plantUUID, user, description = "Image uploaded", metadata) {
    await this.#log(plantUUID, user, "image_uploaded", description, metadata);
  }

  async logImageRemoved(plantUUID, user, description = "Image removed", metadata) {
    await this.#log(plantUUID, user, "image_removed", description, metadata);
  }

  async logDiseaseDetected(plantUUID, user, description = "Disease detected", metadata) {
    await this.#log(plantUUID, user, "disease_detected", description, metadata);
  }

  async logPlantDataExtracted(plantUUID, user, description = "Plant data extracted from image", metadata) {
    await this.#log(plantUUID, user, "plant_data_extracted", description, metadata);
  }

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
