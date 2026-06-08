import { PlantModel } from "../model/plant.model.js";

/**
 * @description Data access layer for plant documents. Provides CRUD
 * operations plus specialised methods for image management, disease
 * detection history, and harvest-date tracking against MongoDB.
 */
class PlantRepository {
  /**
   * @description Creates a new plant document. Automatically sets hasDisease
   * based on whether the disease name is not "healthy".
   * @param {Object} data - Plant creation payload
   * @returns {Promise<Object>} Created document (plain object)
   */
  async create(data) {
    const doc = await new PlantModel({
      ...data,
      hasDisease: data.disease ? data.disease.name !== "healthy" : false,
    }).save();

    return doc.toObject();
  }

  /**
   * @description Finds a plant by its UUID.
   * @param {string} uuid - Plant UUID
   * @returns {Promise<Object|null>}
   */
  async findByUUID(uuid) {
    return await PlantModel.findOne({ uuid }).lean();
  }

  /**
   * @description Finds a plant by its internal ID.
   * @param {number} internalId - Internal plant ID
   * @returns {Promise<Object|null>}
   */
  async findByInternalId(internalId) {
    return await PlantModel.findOne({ internalId }).lean();
  }

  /**
   * @description Finds all plants owned by a given user.
   * @param {number} userInternalId - Internal ID of the owning user
   * @returns {Promise<Array>}
   */
  async findByUserInternalId(userInternalId) {
    return await PlantModel.find({ userInternalId }).lean();
  }

  /**
   * @description Updates a plant by its UUID. Recalculates hasDisease if
   * the update includes a disease field.
   * @param {string} uuid - Plant UUID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object|null>} Updated document or null if not found
   */
  async updateByUUID(uuid, updateData) {
    const currentPlant = await this.findByUUID(uuid);

    if (!currentPlant) {
      return null;
    }

    const hasDisease = updateData.disease
      ? updateData.disease.name !== "healthy"
      : currentPlant.hasDisease;

    return await PlantModel.findOneAndUpdate(
      { uuid },
      { $set: { ...updateData, hasDisease, updatedAt: new Date() } },
      { returnDocument: "after" },
    ).lean();
  }

  /**
   * @description Deletes a plant by its UUID.
   * @param {string} uuid - Plant UUID
   * @returns {Promise<number>} Number of deleted documents (0 or 1)
   */
  async deleteByUUID(uuid) {
    const result = await PlantModel.deleteOne({ uuid });
    return result.deletedCount;
  }

  /**
   * @description Returns all plant documents.
   * @returns {Promise<Array>}
   */
  async findAll() {
    return await PlantModel.find({}).lean();
  }

  /**
   * @description Paginates through all plants, sorted by creation date
   * descending.
   * @param {Object} [options]
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<Array>}
   */
  async paginate({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    return await PlantModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * @description Appends a file name to the plant's CDN images array.
   * @param {string} uuid - Plant UUID
   * @param {string} fileName - Image file name to add
   * @returns {Promise<Object|null>} Updated plant or null if not found
   */
  async addImage(uuid, fileName) {
    const plant = await this.findByUUID(uuid);

    if (!plant) {
      return null;
    }

    const currentImages = plant.cdn?.images || [];
    currentImages.push(fileName);

    return await this.updateByUUID(uuid, { "cdn.images": currentImages });
  }

  /**
   * @description Sets the CDN base path for the plant's images.
   * @param {string} uuid - Plant UUID
   * @param {string} basePath - Base CDN path (S3 prefix)
   * @returns {Promise<Object|null>} Updated plant or null
   */
  async setBasePath(uuid, basePath) {
    return await this.updateByUUID(uuid, { "cdn.basePath": basePath });
  }

  /**
   * @description Removes a file name from the plant's CDN images array.
   * @param {string} uuid - Plant UUID
   * @param {string} imageName - Image file name to remove
   * @returns {Promise<Object|null>} Updated plant or null if not found
   */
  async removeImage(uuid, imageName) {
    const plant = await this.findByUUID(uuid);

    if (!plant) {
      return null;
    }

    const filteredImages = (plant.cdn?.images || []).filter(
      (img) => img !== imageName,
    );

    return await this.updateByUUID(uuid, { "cdn.images": filteredImages });
  }

  /**
   * @description Sets the expected harvest date for a plant.
   * @param {string} uuid - Plant UUID
   * @param {Date|string} harvestDate - Expected harvest date
   * @returns {Promise<Object|null>} Updated plant or null
   */
  async setExpectedHarvestDate(uuid, harvestDate) {
    return await this.updateByUUID(uuid, {
      expectedHarvestDate: new Date(harvestDate),
    });
  }

  /**
   * @description Stores a disease detection result on the plant, including
   * the current detection and a history record.
   * @param {Object} params
   * @param {string} params.plantUUID - UUID of the plant
   * @param {Object} params.prediction - Detection result with name, confidence, detectedAt
   * @returns {Promise<Object|null>} Updated plant or null if not found
   */
  async saveDiseaseDetectionResult({ plantUUID, prediction }) {
    const plant = await this.findByUUID(plantUUID);
    if (!plant) {
      return null;
    }

    const detectionRecord = {
      name: prediction.name || prediction.disease || "healthy",
      confidence: prediction.confidence ?? 1,
      detectedAt: prediction.detectedAt || new Date(),
    };

    const existingHistory = plant.diseaseHistory || [];
    existingHistory.push(detectionRecord);

    return await this.updateByUUID(plantUUID, {
      disease: detectionRecord,
      diseaseHistory: existingHistory,
    });
  }
}

export default PlantRepository;
