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
  /**
   * @param {object} plantCareStateRepository - Repository for plant care state persistence
   */
  constructor(plantCareStateRepository) {
    this.repo = plantCareStateRepository;
  }

  /**
   * Creates a new plant care state document
   * @param {object} data - Care state data to create
   * @returns {Promise<object>} The created care state document
   */
  async create(data) {
    return await this.repo.create(data);
  }

  /**
   * Retrieves a care state by its UUID
   * @param {string} uuid - The care state UUID
   * @returns {Promise<object|null>} The care state document, or null if not found
   */
  async getByUUID(uuid) {
    return await this.repo.findByUUID(uuid);
  }

  /**
   * Retrieves a care state by its internal ID
   * @param {number} internalId - The care state internal ID
   * @returns {Promise<object|null>} The care state document, or null if not found
   */
  async getByInternalId(internalId) {
    return await this.repo.findByInternalId(internalId);
  }

  /**
   * Retrieves a care state by the plant's UUID
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<object|null>} The care state document, or null if not found
   */
  async getByPlantUUID(plantUUID) {
    return await this.repo.findByPlantUUID(plantUUID);
  }

  /**
   * Retrieves care states for multiple plant UUIDs
   * @param {string[]} plantUUIDs - Array of plant UUIDs
   * @returns {Promise<object[]>} Array of care state documents
   */
  async getByPlantUUIDs(plantUUIDs) {
    return await this.repo.findByPlantUUIDs(plantUUIDs);
  }

  /**
   * Updates a care state by its UUID
   * @param {string} uuid - The care state UUID
   * @param {object} data - Fields to update
   * @returns {Promise<object|null>} The updated care state document, or null if not found
   */
  async updateByUUID(uuid, data) {
    return await this.repo.updateByUUID(uuid, data);
  }

  /**
   * Updates a care state by the plant's UUID
   * @param {string} plantUUID - UUID of the plant
   * @param {object} data - Fields to update
   * @returns {Promise<object|null>} The updated care state document, or null if not found
   */
  async updateByPlantUUID(plantUUID, data) {
    return await this.repo.updateByPlantUUID(plantUUID, data);
  }

  /**
   * Deletes a care state by its UUID
   * @param {string} uuid - The care state UUID
   * @returns {Promise<object|null>} The result of the delete operation
   */
  async deleteByUUID(uuid) {
    return await this.repo.deleteByUUID(uuid);
  }

  /**
   * Deletes a care state by the plant's UUID
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<object|null>} The result of the delete operation
   */
  async deleteByPlantUUID(plantUUID) {
    return await this.repo.deleteByPlantUUID(plantUUID);
  }

  /**
   * Paginates through all care state documents
   * @param {object} [options] - Pagination options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<object>} Paginated results with items and metadata
   */
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
