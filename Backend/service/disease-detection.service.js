import axios from "axios";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCode from "../shared/util/HttpStatusCodes.js";

import { DISEASE_DETECTION_URL } from "../config/config.js";

/**
 * @description Orchestrates disease detection by sending plant images to
 * a remote ML microservice. Provides context-aware detection (with user/plant
 * metadata) and general-purpose detection (image only). Falls back to a safe
 * "healthy" prediction when the ML service is unreachable.
 */
class DiseaseDetectionService {
  constructor(repository, userService, s3CloudService) {
    // internal axios instance
    this.httpClient = axios.create({
      baseURL: DISEASE_DETECTION_URL,
      timeout: 20000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.plantRepository = repository;
    this.userService = userService;
    this.s3CloudService = s3CloudService;
  }

  /**
   * @description Sends an S3 image key along with user/plant context to the
   * ML microservice for disease detection. Falls back to "healthy" on failure.
   * @param {Object} params
   * @param {string} params.key - S3 key of the plant image
   * @param {string} params.userId - UUID of the plant owner
   * @param {string} params.plantId - UUID of the plant
   * @param {string} [params.expectedPlant] - Expected plant species for context
   * @returns {Promise<{prediction: {disease: string, confidence: number, detectedAt: string}}>}
   */
  async detectDisease({ key, userId, plantId, expectedPlant }) {
    this.s3CloudService.validatePlantImageKey(key);

    try {
      const response = await this.httpClient.post("/predict", {
        key,
        user_id: userId,
        plant_id: plantId,
        expected_plant: expectedPlant,
      });

      if (response.data?.success === false) {
        console.error("ML service returned error:", response.data.error);
        return {
          prediction: {
            disease: "healthy",
            confidence: 1,
            detectedAt: new Date().toISOString(),
          },
        };
      }

      return response.data;
    } catch (error) {
      console.error(
        "Disease detection service unavailable, returning fallback:",
        error.message,
      );
      return {
        prediction: {
          disease: "healthy",
          confidence: 1,
          detectedAt: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * @description Sends only the S3 key (no user/plant context) to the ML
   * microservice for general-purpose disease detection. Returns a simplified
   * result-focused shape with model metadata.
   * @param {Object} params
   * @param {string} params.key - S3 key of the image
   * @returns {Promise<{disease: string, plant: string, confidence: number, disease_type: string, topPredictions: Array, model?: {name: string, version: string}}>}
   */
  async detectGeneralDisease({ key }) {
    try {
      const response = await this.httpClient.post("/predict/general", { key });

      if (response.data?.success === false) {
        console.error("ML service returned error:", response.data.error);
        return {
          disease: "healthy",
          plant: "unknown",
          confidence: 1,
          disease_type: "healthy",
          topPredictions: [],
        };
      }

      return this.#simplifyMlResponse(response.data);
    } catch (error) {
      console.error("General disease detection failed:", error.message);
      return {
        disease: "healthy",
        plant: "unknown",
        confidence: 1,
        disease_type: "healthy",
        topPredictions: [],
      };
    }
  }

  /**
   * @private
   * @description Extracts prediction result and model metadata from the raw
   * ML response into a simpler shape.
   * @param {Object} data - Raw response from ML service
   * @returns {{disease: string, plant: string, confidence: number, disease_type: string, topPredictions: Array, model?: {name: string, version: string}}}
   */
  #simplifyMlResponse(data) {
    const pred = data?.prediction;
    if (!pred || !pred.class) {
      return {
        disease: "healthy",
        plant: "unknown",
        confidence: 1,
        disease_type: "healthy",
        topPredictions: [],
      };
    }

    const result = {
      disease: pred.class.disease || "healthy",
      plant: pred.class.plant || "unknown",
      confidence: pred.confidence ?? 1,
      disease_type: pred.class.disease_type || "unknown",
      topPredictions: (pred.top_k || []).map(p => ({
        disease: p.class.disease,
        plant: p.class.plant,
        confidence: p.confidence,
      })),
    };

    if (data.model) {
      result.model = {
        name: data.model.name,
        version: data.model.version,
      };
    }

    return result;
  }

  /**
   * @private
   * @description Normalises the raw ML microservice response into a standard
   * disease record shape consumed by the repository layer.
   * @param {Object} mlResponse - Raw response from ML service
   * @returns {{name: string, confidence: number, detectedAt: Date}}
   */
  #transformMlResponse(mlResponse) {
    const prediction = mlResponse?.prediction;
    if (!prediction) {
      return { name: "healthy", confidence: 1, detectedAt: new Date() };
    }

    const disease = {
      name: prediction.class?.disease || prediction.disease || "healthy",
      confidence: prediction.confidence ?? 1,
      detectedAt: new Date(),
    };

    return disease;
  }

  /**
   * @description Transforms the ML response and persists the disease
   * detection result to the plant's history via the repository.
   * @param {string} plantId - UUID of the plant
   * @param {Object} mlResponse - Raw response from ML service
   * @returns {Promise<Object>} Updated plant document
   */
  async updateDiseaseHistory(plantId, mlResponse) {
    const diseaseRecord = this.#transformMlResponse(mlResponse);
    const updatedPlant = await this.plantRepository.saveDiseaseDetectionResult({
      plantUUID: plantId,
      prediction: diseaseRecord,
    });
    return updatedPlant;
  }

  /**
   * @description Combines detection + persistence in one call. Sends the
   * image to the ML service, saves the result to the plant's disease history,
   * and returns the response shape with model metadata (not persisted).
   * @param {Object} params
   * @param {string} params.key - S3 key of the plant image
   * @param {string} params.userId - UUID of the plant owner
   * @param {string} params.plantId - UUID of the plant
   * @param {string} [params.expectedPlant] - Expected plant species
   * @returns {Promise<{disease: Object, diseaseHistory: Array, model?: {name: string, version: string}}>}
   */
  async detectAndSaveDisease({ key, userId, plantId, expectedPlant }) {
    const mlResponse = await this.detectDisease({ key, userId, plantId, expectedPlant });
    const updatedPlant = await this.updateDiseaseHistory(plantId, mlResponse);
    const { disease, diseaseHistory } = updatedPlant;

    const result = { disease, diseaseHistory };
    if (mlResponse.model) {
      result.model = {
        name: mlResponse.model.name,
        version: mlResponse.model.version,
      };
    }

    return result;
  }
}

export default DiseaseDetectionService;
