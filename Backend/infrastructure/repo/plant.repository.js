import { PlantModel } from "../../model/plant.model.js";
import Plant from "../../entity/plant.entity.js";

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

    return new Plant(doc.toObject());
  }

  /**
   * @description Finds a plant by its UUID.
   * @param {string} uuid - Plant UUID
   * @returns {Promise<Object|null>}
   */
  async findByUUID(uuid) {
    const doc = await PlantModel.findOne({ uuid }).lean();
    return doc ? new Plant(doc) : null;
  }

  /**
   * @description Finds a plant by its internal ID.
   * @param {number} internalId - Internal plant ID
   * @returns {Promise<Object|null>}
   */
  async findByInternalId(internalId) {
    const doc = await PlantModel.findOne({ internalId }).lean();
    return doc ? new Plant(doc) : null;
  }

  /**
   * @description Finds all plants owned by a given user.
   * @param {number} userInternalId - Internal ID of the owning user
   * @returns {Promise<Array>}
   */
  async findByUserInternalId(userInternalId) {
    const docs = await PlantModel.find({ userInternalId }).lean();
    return docs.map((doc) => new Plant(doc));
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

    const doc = await PlantModel.findOneAndUpdate(
      { uuid },
      { $set: { ...updateData, hasDisease, updatedAt: new Date() } },
      { returnDocument: "after" },
    ).lean();
    return doc ? new Plant(doc) : null;
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
    const docs = await PlantModel.find({}).lean();
    return docs.map((doc) => new Plant(doc));
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

    const docs = await PlantModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return docs.map((doc) => new Plant(doc));
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
}

export default PlantRepository;
