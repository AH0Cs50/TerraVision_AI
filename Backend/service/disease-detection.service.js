import axios from "axios";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCode from "../shared/util/HttpStatusCodes.js";

import { DISEASE_DETECTION_URL } from "../config/config.js";

class DiseaseDetectionService {
  constructor(repository, userService) {
    // internal axios instance
    this.httpClient = axios.create({
      baseURL: DISEASE_DETECTION_URL,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.plantRepository = repository;
    this.userService = userService;
  }

  async #resolveUserInternalId(userUUID) {
    const user = await this.userService.findByUUID(userUUID);
    return user.internalId;
  }

  // =========================================
  // Send image key to ML microservice
  // =========================================
  async detectDisease({ key, userId, plantId }) {
    const internalId = await this.#resolveUserInternalId(userId);

    try {
      const response = await this.httpClient.post("/predict", {
        key,
        user_id: internalId,
        plant_id: plantId,
      });

      return response.data;
    } catch (error) {
      console.error("Disease detection failed:", error.message);
      throw new RouteError(
        HttpStatusCode.InternalServerError,
        "Failed to detect disease. Please try again later.",
        error.message,
      );
    }
  }

  // =========================================
  // Send image key to ML microservice for general detection
  //   sends only key — no user/plant context
  // =========================================
  async detectGeneralDisease({ key }) {
    try {
      const response = await this.httpClient.post("/predict/general", { key });

      return response.data;
    } catch (error) {
      console.error("General disease detection failed:", error.message);
      throw new RouteError(
        HttpStatusCode.InternalServerError,
        "Failed to detect disease. Please try again later.",
        error.message,
      );
    }
  }

  #transformMlResponse(mlResponse) {
    const prediction = mlResponse.prediction;

    const disease = {
      name: prediction.class?.disease || prediction.disease || "healthy",
      confidence: prediction.confidence ?? 1,
      detectedAt: new Date(),
    };

    return disease;
  }

  async updateDiseaseHistory(plantId, mlResponse) {
    const diseaseRecord = this.#transformMlResponse(mlResponse);
    const updatedPlant = await this.plantRepository.saveDiseaseDetectionResult({
      plantUUID: plantId,
      prediction: diseaseRecord,
    });
    return updatedPlant;
  }
}

export default DiseaseDetectionService;
