import axios from "axios";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCode from "../shared/util/HttpStatusCode.js";

import { DISEASE_DETECTION_URL } from "../config/config.js";

class DiseaseDetectionService {
  constructor(repository) {
    // internal axios instance
    this.httpClient = axios.create({
      baseURL: DISEASE_DETECTION_URL,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.plantRepository = repository;
  }

  // =========================================
  // Send image key to ML microservice
  // =========================================
  async detectDisease({ key, userId, plantId }) {
    try {
      const response = await this.httpClient.post("/predict", {
        key,
        userId,
        plantId,
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

  // for transform the disease detection microservice response
  #transformMlResponse(mlResponse) {
    const prediction = mlResponse.prediction;

    const disease = {
      name: prediction.disease || "healthy",
      confidence: prediction.confidence ?? 1,
      detectedAt: new Date(),
    };

    return disease;
  }

  // plant id here is UUID
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
