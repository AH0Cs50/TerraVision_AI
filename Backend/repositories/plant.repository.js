// repository/plant.repository.js
import { plantsDB } from "../db/nedb.js";
import { createPlantModel } from "../models/plant.model.js";

class PlantRepository {

  /**
   * Create plant
   */
  async create(data) {

    const plant = createPlantModel(data);

    return await plantsDB.insert(plant);
  }

  /**
   * Find by uuid
   */
  async findByUUID(uuid) {

    return await plantsDB.findOne({ uuid });
  }

  /**
   * Find by internal id
   */
  async findByInternalId(internalId) {

    return await plantsDB.findOne({
      internalId
    });
  }

  /**
   * Find all plants for user
   */
  async findByUserId(userInternalId) {

    return await plantsDB.find({
      userInternalId
    });
  }

  /**
   * Update plant
   */
  async updateByUUID(uuid, updateData) {

    return await plantsDB.update(
      { uuid },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      {}
    );
  }

  async updateByInternalId(internalId, updateData) {

    return await plantsDB.update(
      { internalId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      {}
    );
  }

  /**
   * Delete plant
   */
  async deleteByUUID(uuid) {

    return await plantsDB.remove(
      { uuid },
      {}
    );
  }

  /**
   * Get all plants
   */
  async findAll() {

    return await plantsDB.find({});
  }
}

export default PlantRepository;