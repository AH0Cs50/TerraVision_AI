import { PlantModel } from "../model/plant.model.js";
import { DiseaseDTO } from "../dto/plant.dto.js";

class PlantRepository {
  /**
   * Create plant
   */
  async create(data) {
    const now = new Date();
    const ageDays = data.plantedAt
      ? Math.floor((now - new Date(data.plantedAt)) / (1000 * 60 * 60 * 24))
      : 0;

    const doc = await new PlantModel({
      ...data,
      ageDays,
      hasDisease: data.disease ? data.disease.name !== "healthy" : false,
    }).save();
    return doc.toObject();
  }

  /**
   * Find by uuid
   */
  async findByUUID(uuid) {
    return await PlantModel.findOne({ uuid }).lean();
  }

  /**
   * Find by internal id
   */
  async findByInternalId(internalId) {
    return await PlantModel.findOne({ internalId }).lean();
  }

  /**
   * Get all plants for user
   */
  async findByUserInternalId(userInternalId) {
    return await PlantModel.find({ userInternalId }).lean();
  }

  /**
   * Update plant by uuid
   */
  async updateByUUID(uuid, updateData) {
    const currentPlant = await this.findByUUID(uuid);

    if (!currentPlant) {
      return null;
    }

    /**
     * Recalculate derived values
     */
    const hasDisease = updateData.disease
      ? updateData.disease.name !== "healthy"
      : currentPlant.hasDisease;

    const plantedAt = updateData.plantedAt || currentPlant.plantedAt;

    const ageDays = Math.floor(
      (new Date() - new Date(plantedAt)) / (1000 * 60 * 60 * 24),
    );

    return await PlantModel.findOneAndUpdate(
      { uuid },
      {
        $set: {
          ...updateData,

          hasDisease,

          ageDays,

          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    ).lean();
  }

  /**
   * Delete plant
   */
  async deleteByUUID(uuid) {
    const result = await PlantModel.deleteOne({ uuid });
    return result.deletedCount;
  }

  /**
   * Get all plants
   */
  async findAll() {
    return await PlantModel.find({}).lean();
  }

  /**
   * Pagination
   */
  async paginate({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    return await PlantModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  }

  /**
   * Add image to plant
   */
  async addImage(uuid, imageName) {
    const plant = await this.findByUUID(uuid);

    if (!plant) {
      return null;
    }

    const currentImages = plant.cdn?.images || [];
    const isFirstImage = currentImages.length === 0;

    currentImages.push(imageName);

    const update = {
      "cdn.images": currentImages,
      updatedAt: new Date(),
    };

    if (isFirstImage) {
      update["cdn.basePath"] = imageName.substring(0, imageName.lastIndexOf("/") + 1);
    }

    return await PlantModel.findOneAndUpdate(
      { uuid },
      { $set: update },
      { returnDocument: "after" },
    ).lean();
  }

  /**
   * Remove image from plant
   */
  async removeImage(uuid, imageName) {
    const plant = await this.findByUUID(uuid);

    if (!plant) {
      return null;
    }

    const filteredImages = (plant.cdn?.images || []).filter(
      (img) => img !== imageName,
    );

    return await PlantModel.findOneAndUpdate(
      { uuid },
      {
        $set: {
          "cdn.images": filteredImages,

          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    ).lean();
  }

  /**
   * Set expected harvest date for a plant
   */
  async setExpectedHarvestDate(uuid, harvestDate) {
    return await this.updateByUUID(uuid, {
      expectedHarvestDate: new Date(harvestDate),
    });
  }

  /**
   * Store ML disease detection result
   */
  async saveDiseaseDetectionResult({ plantUUID, prediction }) {
    const plant = await this.findByUUID(plantUUID);
    if (!plant) {
      return null;
    }

    const detectionRecord = DiseaseDTO.parse({
      name: prediction.name || prediction.disease || "healthy",
      confidence: prediction.confidence ?? 1,
      detectedAt: prediction.detectedAt || new Date(),
    });

    const existingHistory = plant.diseaseHistory || [];
    existingHistory.push(detectionRecord);

    return await this.updateByUUID(plantUUID, {
      disease: detectionRecord,
      diseaseHistory: existingHistory,
    });
  }
}

export default PlantRepository;
