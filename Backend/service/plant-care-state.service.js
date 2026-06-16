import {
  engineScoresToStatus,
  buildEngineScores,
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

  async getByPlantUUIDs(plantUUIDs) {
    return await this.repo.findByPlantUUIDs(plantUUIDs);
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
