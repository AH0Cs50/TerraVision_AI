import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { fillPrompt } from "./llm.service.js";

import { GROWTH_STAGES } from "../model/plant.model.js";

/**
 * @description Core service for plant CRUD operations. Manages plant creation
 * (with AI-driven growth stage and harvest date derivation), updates, deletion,
 * image management, and access control. Provides a specialised data shape
 * for the analysis engine.
 */
class PlantService {
  constructor(plantRepository, s3CloudRepository, userService, llmService) {
    this.plantRepository = plantRepository;
    this.s3CloudRepository = s3CloudRepository;
    this.userService = userService;
    this.llmService = llmService;
  }

  /**
   * @private
   * @description Resolves a user's UUID to their internal numeric ID.
   * @param {string} userUUID - User's UUID
   * @returns {Promise<number>} Internal user ID
   */
  async #resolveUserInternalId(userUUID) {
    const user = await this.userService.findByUUID(userUUID);
    return user.internalId;
  }

  /**
   * @description Verifies that a user has access to a plant. Admins bypass
   * ownership checks; regular users must own the plant.
   * @param {string} plantUUID - UUID of the plant
   * @param {string} userUUID - UUID of the requesting user
   * @param {string} role - User role ("admin" bypasses ownership check)
   * @returns {Promise<Object>} The plant document
   * @throws {RouteError} NOT_FOUND or FORBIDDEN
   */
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

  /**
   * @private
   * @description Calculates the plant's age in days. Uses the provided
   * ageDays value if given; otherwise computes from plantedAt.
   * @param {number|null} ageDays - Explicit age in days
   * @param {string|null} plantedAt - ISO date string of planting
   * @returns {number} Age in days (0 if neither is available)
   */
  #calcAgeDays(ageDays, plantedAt) {
    return (
      ageDays ??
      (plantedAt
        ? Math.floor((Date.now() - new Date(plantedAt).getTime()) / 86400000)
        : 0)
    );
  }

  /**
   * @description Creates a new plant record. Derives ageDays, growth stage
   * (via LLM if available), and expected harvest date automatically.
   * @param {Object} data - Plant creation payload
   * @param {string} userUUID - UUID of the owning user
   * @returns {Promise<Object>} Created plant document
   */
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

  /**
   * @private
   * @description Uses the LLM to determine the plant's growth stage from
   * its name, family, category, and age. Falls back to "vegetative" on error
   * or if no LLM service is available.
   * @param {Object} data - Plant data with name, family, category, ageDays
   * @returns {Promise<string>} Derived growth stage
   */
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

  /**
   * @private
   * @description Uses the LLM to estimate the expected harvest date from
   * plant metadata. Falls back to a category-based compute if LLM is
   * unavailable, errors, or returns an unparseable date.
   * @param {Object} data - Plant data with name, family, category, plantedAt
   * @returns {Promise<Date|null>} Estimated harvest date or null if plantedAt missing
   */
  async #deriveExpectedHarvestDate(data) {
    if (this.llmService) {
      try {
        const prompt = fillPrompt("HARVEST_DATE", {
          plantName: data.name,
          commonName: data.commonName || "not specified",
          family: data.family,
          category: data.category,
          plantedAt: data.plantedAt
            ? new Date(data.plantedAt).toISOString()
            : "unknown",
          growthStage: data.growthStage || "unknown",
        });
        const response = await this.llmService.generateResponse(prompt);
        const dateStr = typeof response === "string" ? response.trim() : "";
        const parsed = new Date(dateStr);
        if (!Number.isNaN(parsed.getTime())) return parsed;
      } catch {
        /* fall through to fallback */
      }
    }

    if (!data.plantedAt) return null;
    const fallbackDays = { crop: 90, flower: 60, tree: 365 };
    const days = fallbackDays[data.category] || 90;
    return new Date(new Date(data.plantedAt).getTime() + days * 86400000);
  }

  /**
   * @description Retrieves a plant by its UUID.
   * @param {string} uuid - Plant UUID
   * @returns {Promise<Object|null>} Plant document or null
   */
  async getPlantByUUID(uuid) {
    return await this.plantRepository.findByUUID(uuid);
  }

  /**
   * @description Returns all plants owned by the given user.
   * @param {string} userUUID - UUID of the user
   * @returns {Promise<Array>} Array of plant documents
   */
  async getUserPlants(userUUID) {
    const userInternalId = await this.#resolveUserInternalId(userUUID);
    return await this.plantRepository.findByUserInternalId(userInternalId);
  }

  /**
   * @description Updates a plant's fields. Recalculates ageDays if plantedAt
   * changes or ageDays is explicitly provided.
   * @param {string} uuid - Plant UUID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object|null>} Updated plant or null if not found
   */
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

  /**
   * @description Deletes a plant by its UUID.
   * @param {string} uuid - Plant UUID
   * @returns {Promise<Object|null>} Deletion result
   */
  async deletePlant(uuid) {
    return await this.plantRepository.deleteByUUID(uuid);
  }

  /**
   * @description Returns all plants in the system (admin only).
   * @returns {Promise<Array>} Array of all plant documents
   */
  async getAllPlants() {
    return await this.plantRepository.findAll();
  }

  /**
   * @description Paginates through all plants in the system.
   * @param {Object} [options]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @returns {Promise<Object>} Paginated result
   */
  async paginatePlants({ page, limit }) {
    return await this.plantRepository.paginate({
      page,
      limit,
    });
  }

  /**
   * @description Estimates the expected harvest date for a plant using the
   * LLM, based on planting date, category, name, and family.
   * @param {string} plantedAt - ISO date string of planting
   * @param {string} category - Plant category (e.g. crop, ornamental)
   * @param {string} plantName - Common name of the plant
   * @param {string} family - Plant family
   * @returns {Promise<Date|null>} Estimated date or null
   */
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

  /**
   * @description Composes a flat plant data object suited for the rule-based
   * analysis engine. Extracts category, family, age, growth stage, soil,
   * watering, and stress fields.
   * @param {string} plantUUID - UUID of the plant
   * @returns {Promise<{plant: Object, soil: Object, watering: Object, stress: Object}>}
   * @throws {RouteError} NOT_FOUND if plant does not exist
   */
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
        hoursSinceLastFertilized: Plant.soil?.lastFertilized
          ? Math.floor((Date.now() - new Date(Plant.soil.lastFertilized).getTime()) / 3600000)
          : null,
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

  /**
   * @description Resolves a plant's UUID to its internal numeric ID.
   * @param {string} plantUUID - Plant UUID
   * @returns {Promise<number|null>} Internal plant ID or null if not found
   */
  async getInternalId(plantUUID) {
    const plant = await this.plantRepository.findByUUID(plantUUID);
    return plant ? plant.internalId : null;
  }

  /**
   * @description Updates the watering record for a plant, resetting
   * hoursSinceLastWatering (typically set to 0 after watering).
   * @param {string} uuid - Plant UUID
   * @param {number} [hoursSinceLastWatering=0] - Hours since last watering
   * @returns {Promise<Object>} Updated plant document
   * @throws {RouteError} BAD_REQUEST if value is negative, NOT_FOUND if plant missing
   */
  async updateWatering(uuid, hoursSinceLastWatering = 0) {
    if (hoursSinceLastWatering < 0) {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "hoursSinceLastWatering must be >= 0",
      );
    }

    const plant = await this.getPlantByUUID(uuid);
    if (!plant) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found");
    }

    return await this.plantRepository.updateByUUID(uuid, {
      "watering.hoursSinceLastWatering": hoursSinceLastWatering,
    });
  }

  /**
   * @description Adds an image reference to the plant. If it is the first
   * image, also sets the base CDN path on the plant record.
   * @param {string} uuid - Plant UUID
   * @param {string} s3Key - Full S3 key of the uploaded image
   * @returns {Promise<Object>} Updated plant document
   */
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

  /**
   * @description Removes an image reference from the plant's image list.
   * @param {string} uuid - Plant UUID
   * @param {string} imageName - Image file name (or full key, name is extracted)
   * @returns {Promise<Object|string>} Updated plant or "nothing to remove" message
   */
  async removeImage(uuid, imageName) {
    const plant = await this.plantRepository.findByUUID(uuid);
    const empty = !plant?.cdn?.images?.length;

    if (empty) return "nothing to remove";

    const fileName = imageName.substring(imageName.lastIndexOf("/") + 1);
    return await this.plantRepository.removeImage(uuid, fileName);
  }

  async applyFertilizing(uuid) {
    return await this.plantRepository.updateByUUID(uuid, { "soil.lastFertilized": new Date() });
  }

  async applyPruning(uuid) {
    return await this.plantRepository.updateByUUID(uuid, { "soil.lastPruned": new Date() });
  }

  async applyDiseaseTreatment(uuid) {
    return await this.plantRepository.updateByUUID(uuid, {
      disease: { name: "healthy", confidence: 1 },
      "stress.diseaseType": "none",
      "stress.severity": "none",
      hasDisease: false,
    });
  }

  async applyHarvest(uuid) {
    return await this.plantRepository.updateByUUID(uuid, { growthStage: "mature" });
  }

  async applyTaskAction(uuid, taskType) {
    switch (taskType) {
      case "fertilizing":
        return this.applyFertilizing(uuid);
      case "pruning":
        return this.applyPruning(uuid);
      case "disease_treatment":
        return this.applyDiseaseTreatment(uuid);
      case "harvest":
        return this.applyHarvest(uuid);
      case "move_light":
        return null;
      default:
        return null;
    }
  }
}

export default PlantService;
