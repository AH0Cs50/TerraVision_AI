import { PlantModel } from "../model/plant.model.js";

class PlantRepository {
  async create(data) {
    const doc = await new PlantModel({
      ...data,
      hasDisease: data.disease ? data.disease.name !== "healthy" : false,
    }).save();

    return doc.toObject();
  }

  async findByUUID(uuid) {
    return await PlantModel.findOne({ uuid }).lean();
  }

  async findByInternalId(internalId) {
    return await PlantModel.findOne({ internalId }).lean();
  }

  async findByUserInternalId(userInternalId) {
    return await PlantModel.find({ userInternalId }).lean();
  }

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

  async deleteByUUID(uuid) {
    const result = await PlantModel.deleteOne({ uuid });
    return result.deletedCount;
  }

  async findAll() {
    return await PlantModel.find({}).lean();
  }

  async paginate({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    return await PlantModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async addImage(uuid, fileName) {
    const plant = await this.findByUUID(uuid);

    if (!plant) {
      return null;
    }

    const currentImages = plant.cdn?.images || [];
    currentImages.push(fileName);

    return await this.updateByUUID(uuid, { "cdn.images": currentImages });
  }

  async setBasePath(uuid, basePath) {
    return await this.updateByUUID(uuid, { "cdn.basePath": basePath });
  }

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

  async setExpectedHarvestDate(uuid, harvestDate) {
    return await this.updateByUUID(uuid, {
      expectedHarvestDate: new Date(harvestDate),
    });
  }

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
