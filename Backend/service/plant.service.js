import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { fillPrompt } from "./llm.service.js";

import { GROWTH_STAGES } from "../model/plant.model.js";

class PlantService {
  constructor(plantRepository, s3CloudRepository, userService, llmService) {
    this.plantRepository = plantRepository;
    this.s3CloudRepository = s3CloudRepository;
    this.userService = userService;
    this.llmService = llmService;
  }

  async #resolveUserInternalId(userUUID) {
    const user = await this.userService.findByUUID(userUUID);
    return user.internalId;
  }

  async verifyPlantAccess(plantUUID, userUUID, role) {
    const plant = await this.getPlantByUUID(plantUUID);
    if (!plant) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found");
    }
    if (role === "admin") return plant;
    const userInternalId = await this.#resolveUserInternalId(userUUID);
    if (plant.userInternalId !== userInternalId) {
      throw new RouteError(HttpStatusCodes.FORBIDDEN, "Forbidden");
    }
    return plant;
  }

  #calcAgeDays(ageDays, plantedAt) {
    return (
      ageDays ??
      (plantedAt
        ? Math.floor((Date.now() - new Date(plantedAt).getTime()) / 86400000)
        : 0)
    );
  }

  // =========================================
  // Create Plant
  // =========================================
  async createPlant(data, userUUID) {
    const userInternalId = await this.#resolveUserInternalId(userUUID);

    const ageDays = this.#calcAgeDays(data.ageDays, data.plantedAt);
    const dataWithAge = { ...data, ageDays };

    const growthStage =
      data.growthStage || (await this.#deriveGrowthStage(dataWithAge));
    const expectedHarvestDate =
      data.expectedHarvestDate ||
      (await this.#deriveExpectedHarvestDate({ ...dataWithAge, growthStage }));

    return await this.plantRepository.create({
      ...dataWithAge,
      growthStage,
      expectedHarvestDate,
      userInternalId,
    });
  }

  async #deriveGrowthStage(data) {
    if (!this.llmService) return data.growthStage || "vegetative";
    try {
      const prompt = fillPrompt("GROWTH_STAGE", {
        growthStagesList: JSON.stringify(GROWTH_STAGES),
        plantName: data.name,
        commonName: data.commonName || "not specified",
        family: data.family,
        category: data.category,
        ageDays: data.ageDays ?? "unknown",
        growthStage: data.growthStage || "not specified",
      });
      const response = await this.llmService.generateResponse(prompt);
      const stage =
        typeof response === "string" ? response.trim().toLowerCase() : "";
      return GROWTH_STAGES.includes(stage)
        ? stage
        : data.growthStage || "vegetative";
    } catch {
      return data.growthStage || "vegetative";
    }
  }

  async #deriveExpectedHarvestDate(data) {
    if (!this.llmService) return null;
    try {
      const prompt = fillPrompt("HARVEST_DATE", {
        plantName: data.name,
        commonName: data.commonName || "not specified",
        family: data.family,
        category: data.category,
        plantedAt: data.plantedAt ? new Date(data.plantedAt).toISOString() : "unknown",
        growthStage: data.growthStage || "unknown",
      });
      const response = await this.llmService.generateResponse(prompt);
      const dateStr = typeof response === "string" ? response.trim() : "";
      const parsed = new Date(dateStr);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  // =========================================
  // Get Plant by UUID
  // =========================================
  async getPlantByUUID(uuid) {
    return await this.plantRepository.findByUUID(uuid);
  }

  // =========================================
  // Get User Plants
  // =========================================
  async getUserPlants(userUUID) {
    const userInternalId = await this.#resolveUserInternalId(userUUID);
    return await this.plantRepository.findByUserInternalId(userInternalId);
  }

  // =========================================
  // Update Plant
  // =========================================
  async updatePlant(uuid, updateData) {
    const currentPlant = await this.getPlantByUUID(uuid);
    if (!currentPlant) return null;

    const ageDays = this.#calcAgeDays(
      updateData.ageDays,
      updateData.plantedAt || currentPlant.plantedAt,
    );

    return await this.plantRepository.updateByUUID(uuid, {
      ...updateData,
      ageDays,
    });
  }

  // =========================================
  // Delete Plant
  // =========================================
  async deletePlant(uuid) {
    return await this.plantRepository.deleteByUUID(uuid);
  }

  // =========================================
  // Get All Plants (Admin)
  // =========================================
  async getAllPlants() {
    return await this.plantRepository.findAll();
  }

  // =========================================
  // Paginate Plants
  // =========================================
  async paginatePlants({ page, limit }) {
    return await this.plantRepository.paginate({
      page,
      limit,
    });
  }

  async calculateExpectedHarvestDate(plantedAt, category, plantName, family) {
    if (!this.llmService) return null;
    try {
      const prompt = fillPrompt("HARVEST_DATE_SIMPLE", {
        plantName,
        family,
        category,
        plantedAt: new Date(plantedAt).toISOString(),
      });
      const response = await this.llmService.generateResponse(prompt);
      const dateStr = typeof response === "string" ? response.trim() : "";
      const parsed = new Date(dateStr);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  async getEnginePlantInput(plantUUID) {
    const Plant = await this.getPlantByUUID(plantUUID);
    if (!Plant) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found");
    }
    return {
      plant: {
        category: Plant.category,
        family: Plant.family,
        ageDays: Plant.ageDays,
        growthStage: Plant.growthStage,
      },
      soil: {
        type: Plant.soil?.type,
        moisture: Plant.soil?.moisture,
      },
      watering: {
        hoursSinceLastWatering: Plant.watering?.hoursSinceLastWatering,
      },
      stress: {
        diseaseType: Plant.stress?.diseaseType,
        severity: Plant.stress?.severity,
      },
    };
  }

  async addImage(uuid, s3Key) {
    const fileName = s3Key.substring(s3Key.lastIndexOf("/") + 1);

    const plant = await this.plantRepository.findByUUID(uuid);
    const isFirstImage = !plant?.cdn?.images?.length;

    const result = await this.plantRepository.addImage(uuid, fileName);

    if (isFirstImage) {
      const basePath = s3Key.substring(0, s3Key.lastIndexOf("/") + 1);
      await this.plantRepository.setBasePath(uuid, basePath);
    }

    return result;
  }

  async removeImage(uuid, imageName) {
    const plant = await this.plantRepository.findByUUID(uuid);
    const empty = !plant?.cdn?.images?.length;

    if (empty) return "nothing to remove";

    const fileName = imageName.substring(imageName.lastIndexOf("/") + 1);
    return await this.plantRepository.removeImage(uuid, fileName);
  }
}

export default PlantService;
