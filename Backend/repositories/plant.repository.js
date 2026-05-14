// repository/plant.repository.js

import { plantsDB } from "../shared/db/index.js";

import { createPlantModel } from "../models/plant.model.js";

class PlantRepository {

  /**
   * Create plant
   */
  async create(data) {

    const plant =
      createPlantModel(data);

    return await plantsDB.insert(plant);
  }

  /**
   * Find by uuid
   */
  async findByUUID(uuid) {

    return await plantsDB.findOne({
      uuidz
    });
  }

  /**
   * Find by internal id
   */
  async findByInternalId(
    internalId
  ) {

    return await plantsDB.findOne({
      internalId
    });
  }

  /**
   * Get all plants for user
   */
  async findByUserInternalId(
    userInternalId
  ) {

    return await plantsDB.find({
      userInternalId
    });
  }

  /**
   * Update plant by uuid
   */
  async updateByUUID(
    uuid,
    updateData
  ) {

    const currentPlant =
      await this.findByUUID(uuid);

    if (!currentPlant) {
      return null;
    }

    /**
     * Recalculate derived values
     */
    const hasDisease =
      updateData.disease
        ? updateData.disease.name !==
          "healthy"
        : currentPlant.hasDisease;

    const plantedAt =
      updateData.plantedAt ||
      currentPlant.plantedAt;

    const ageInDays = Math.floor(
      (new Date() - new Date(plantedAt)) /
      (1000 * 60 * 60 * 24)
    );

    await plantsDB.update(
      { uuid },
      {
        $set: {
          ...updateData,

          hasDisease,

          ageInDays,

          updatedAt: new Date()
        }
      }
    );

    return await this.findByUUID(uuid);
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

  /**
   * Pagination
   */
  async paginate({
    page = 1,
    limit = 20
  } = {}) {

    const skip =
      (page - 1) * limit;

    return await plantsDB
      .cfind({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  /**
   * Add image to plant
   */
  async addImage(
    uuid,
    imageName
  ) {

    const plant =
      await this.findByUUID(uuid);

    if (!plant) {
      return null;
    }

    const currentImages =
      plant.cdn?.images || [];

    currentImages.push(imageName);

    await plantsDB.update(
      { uuid },
      {
        $set: {
          "cdn.images":
            currentImages,

          updatedAt: new Date()
        }
      }
    );

    return await this.findByUUID(uuid);
  }

  /**
   * Remove image from plant
   */
  async removeImage(
    uuid,
    imageName
  ) {

    const plant =
      await this.findByUUID(uuid);

    if (!plant) {
      return null;
    }

    const filteredImages =
      (plant.cdn?.images || [])
        .filter(
          (img) => img !== imageName
        );

    await plantsDB.update(
      { uuid },
      {
        $set: {
          "cdn.images":
            filteredImages,

          updatedAt: new Date()
        }
      }
    );

    return await this.findByUUID(uuid);
  }
}

export default PlantRepository;