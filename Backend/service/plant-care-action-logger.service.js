export class PlantCareActionLogger {
  constructor(actionLogRepo) {
    this.actionLogRepo = actionLogRepo;
  }

  async #log(plantUUID, userUUID, userInternalId, plantInternalId, actionType, description, metadata) {
    try {
      await this.actionLogRepo.create({
        plantUUID, plantInternalId, userUUID, userInternalId, actionType, description, metadata,
      });
    } catch (logError) {
      console.error("Action log failed (non-fatal):", logError.message);
    }
  }

  async addActionLog(plantUUID, userUUID, userInternalId, plantInternalId, { actionType, description, metadata } = {}) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, actionType, description, metadata);
  }

  async logWatering(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant watered", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "watered", description, metadata);
  }

  async logFertilizing(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant fertilized", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "fertilized", description, metadata);
  }

  async logHarvest(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant harvested", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "harvested", description, metadata);
  }

  async logDiseaseScan(plantUUID, userUUID, userInternalId, plantInternalId, description = "Disease scan performed", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "disease_scan", description, metadata);
  }

  async logPlantAnalysis(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant analysis completed", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "plant_analysis", description, metadata);
  }

  async logLightChanged(plantUUID, userUUID, userInternalId, plantInternalId, description = "Light conditions changed", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "light_changed", description, metadata);
  }

  async logTaskCompleted(plantUUID, userUUID, userInternalId, plantInternalId, description = "Task completed", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "task_completed", description, metadata);
  }

  async logTaskAdded(plantUUID, userUUID, userInternalId, plantInternalId, description = "Task added", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "task_added", description, metadata);
  }

  async logPlantCreated(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant created", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "plant_created", description, metadata);
  }

  async logPlantUpdated(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant updated", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "plant_updated", description, metadata);
  }

  async logPlantDeleted(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant deleted", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "plant_deleted", description, metadata);
  }

  async logImageUploaded(plantUUID, userUUID, userInternalId, plantInternalId, description = "Image uploaded", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "image_uploaded", description, metadata);
  }

  async logImageRemoved(plantUUID, userUUID, userInternalId, plantInternalId, description = "Image removed", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "image_removed", description, metadata);
  }

  async logDiseaseDetected(plantUUID, userUUID, userInternalId, plantInternalId, description = "Disease detected", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "disease_detected", description, metadata);
  }

  async logPlantDataExtracted(plantUUID, userUUID, userInternalId, plantInternalId, description = "Plant data extracted from image", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "plant_data_extracted", description, metadata);
  }

  async logInsightGenerated(plantUUID, userUUID, userInternalId, plantInternalId, description = "AI insight generated", metadata) {
    await this.#log(plantUUID, userUUID, userInternalId, plantInternalId, "insight_generated", description, metadata);
  }

  async getRecentLogs(plantUUID, last = 5) {
    return await this.actionLogRepo.getRecent(plantUUID, last);
  }

  async getLogsByType(plantUUID, actionType) {
    const result = await this.actionLogRepo.findByPlantUUID(plantUUID, { page: 1, limit: 1000 });
    return (result.logs || []).filter((l) => l.actionType === actionType);
  }

  async paginateActionLogs(plantUUID, { page = 1, limit = 20 } = {}) {
    return await this.actionLogRepo.findByPlantUUID(plantUUID, { page, limit });
  }

  async clearOldLogs(plantUUID, date = new Date()) {
    return await this.actionLogRepo.deleteOlderThan(plantUUID, date);
  }
}
