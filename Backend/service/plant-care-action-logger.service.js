export class PlantCareActionLogger {
  /**
   * @param {object} actionLogRepo - Repository for action log persistence
   */
  constructor(actionLogRepo, userRepo, plantService) {
    this.actionLogRepo = actionLogRepo;
    this.userRepo = userRepo;
    this.plantService = plantService;
  }

  /**
   * @private
   * @description Internal method that persists an action log entry. Failures are
   * logged to console but never propagated (non-fatal).
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} actionType - Type of action performed
   * @param {string} description - Human-readable description
   * @param {object} [metadata] - Optional metadata payload
   */
  async #log(plantUUID, userUUID, userInternalId, plantInternalId, actionType, description, metadata) {
    try {
      await this.actionLogRepo.create({
        plantUUID, plantInternalId, userUUID, userInternalId, actionType, description, metadata,
      });
    } catch (logError) {
      console.error("Action log failed (non-fatal):", logError.message);
    }
  }

  /**
   * Adds a generic action log entry
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {object} [options] - Log entry options
   * @param {string} options.actionType - Type of action
   * @param {string} options.description - Description of the action
   * @param {object} [options.metadata] - Optional metadata
   */
  async addActionLog(plantUUID, userUUID, userInternalId, plantInternalId, { actionType, description, metadata } = {}) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, actionType, description, metadata);
  }

  /**
   * Convenience wrapper for task manager: resolves internal IDs internally
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {string} description - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logTaskAction(plantUUID, userUUID, description, metadata) {
    const user = await this.userRepo.findByUUID(userUUID);
    const plantInternalId = await this.plantService.getInternalId(plantUUID);
    await this.#log(plantUUID, userUUID, user.internalId, plantInternalId, "task_completed", description, metadata);
  }

  /**
   * Logs a watering action
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Plant watered"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logWatering(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant watered", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "watered", description, metadata);
  }

  /**
   * Logs a fertilizing action
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Plant fertilized"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logFertilizing(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant fertilized", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "fertilized", description, metadata);
  }

  /**
   * Logs a harvest action
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Plant harvested"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logHarvest(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant harvested", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "harvested", description, metadata);
  }

  /**
   * Logs a disease scan action
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Disease scan performed"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logDiseaseScan(plantUUID, userUUID, userInternalId, plantInternalId, description = "Disease scan performed", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "disease_scan", description, metadata);
  }

  /**
   * Logs a plant analysis action
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Plant analysis completed"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logPlantAnalysis(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant analysis completed", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "plant_analysis", description, metadata);
  }

  /**
   * Logs a light condition change
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Light conditions changed"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logLightChanged(plantUUID, userUUID, userInternalId, plantInternalId, description = "Light conditions changed", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "light_changed", description, metadata);
  }

  /**
   * Logs a task completion
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Task completed"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logTaskCompleted(plantUUID, userUUID, userInternalId, plantInternalId, description = "Task completed", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "task_completed", description, metadata);
  }

  /**
   * Logs a task being added
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Task added"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logTaskAdded(plantUUID, userUUID, userInternalId, plantInternalId, description = "Task added", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "task_added", description, metadata);
  }

  /**
   * Logs plant creation
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Plant created"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logPlantCreated(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant created", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "plant_created", description, metadata);
  }

  /**
   * Logs plant update
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Plant updated"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logPlantUpdated(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant updated", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "plant_updated", description, metadata);
  }

  /**
   * Logs plant deletion
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Plant deleted"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logPlantDeleted(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant deleted", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "plant_deleted", description, metadata);
  }

  /**
   * Logs an image upload
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Image uploaded"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logImageUploaded(plantUUID, userUUID, userInternalId, plantInternalId, description = "Image uploaded", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "image_uploaded", description, metadata);
  }

  /**
   * Logs an image removal
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Image removed"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logImageRemoved(plantUUID, userUUID, userInternalId, plantInternalId, description = "Image removed", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "image_removed", description, metadata);
  }

  /**
   * Logs a disease detection event
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Disease detected"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logDiseaseDetected(plantUUID, userUUID, userInternalId, plantInternalId, description = "Disease detected", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "disease_detected", description, metadata);
  }

  /**
   * Logs a plant data extraction from an image
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="Plant data extracted from image"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logPlantDataExtracted(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant data extracted from image", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "plant_data_extracted", description, metadata);
  }

  /**
   * Logs an AI insight generation
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the user
   * @param {number} userInternalId - Internal ID of the user
   * @param {number} plantInternalId - Internal ID of the plant
   * @param {string} [description="AI insight generated"] - Description of the action
   * @param {object} [metadata] - Optional metadata
   */
  async logInsightGenerated(plantUUID, userUUID, userInternalId, plantInternalId, description = "AI insight generated", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "insight_generated", description, metadata);
  }

  /**
   * Retrieves the most recent action logs for a plant
   * @param {string} plantUUID - UUID of the plant
   * @param {number} [last=5] - Number of recent logs to retrieve
   * @returns {Promise<object[]>} Array of recent action log entries
   */
  async getRecentLogs(plantUUID, last = 5) {
    return await this.actionLogRepo.getRecent(plantUUID, last);
  }

  /**
   * Retrieves action logs filtered by action type
   * @param {string} plantUUID - UUID of the plant
   * @param {string} actionType - Action type to filter by
   * @returns {Promise<object[]>} Array of matching action log entries
   */
  async getLogsByType(plantUUID, actionType) {
    const result = await this.actionLogRepo.findByPlantUUID(plantUUID, { page: 1, limit: 1000 });
    return (result.logs || []).filter((l) => l.actionType === actionType);
  }

  /**
   * Paginates through action logs for a plant
   * @param {string} plantUUID - UUID of the plant
   * @param {object} [options] - Pagination options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<object>} Paginated logs with results and metadata
   */
  async paginateActionLogs(plantUUID, { page = 1, limit = 20 } = {}) {
    return await this.actionLogRepo.findByPlantUUID(plantUUID, { page, limit });
  }

  /**
   * Deletes action logs older than a specified date
   * @param {string} plantUUID - UUID of the plant
   * @param {Date} [date=new Date()] - Cutoff date; logs older than this are deleted
   * @returns {Promise<object>} Result of the delete operation
   */
  async clearOldLogs(plantUUID, date = new Date()) {
    return await this.actionLogRepo.deleteOlderThan(plantUUID, date);
  }
}
