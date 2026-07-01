import axios from "axios";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { DISEASE_DETECTION_URL } from "../config/config.js";
import { plantRepo, s3CloudService } from "../shared/container.js";

const httpClient = axios.create({
  baseURL: DISEASE_DETECTION_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Transforms the raw ML service response into a disease record suitable for the plant entity
 * @param {{ prediction?: { class?: { disease?: string, disease_type?: string }, disease?: string, confidence?: number } }} mlResponse - Raw ML API response
 * @returns {{ name: string, confidence: number, detectedAt: Date, diseaseType: string }} Normalized disease record
 */
function transformMlResponse(mlResponse) {
  const prediction = mlResponse?.prediction;
  if (!prediction) {
    return { name: "healthy", confidence: 1, detectedAt: new Date(), diseaseType: "none" };
  }
  return {
    name: prediction.class?.disease || prediction.disease || "healthy",
    confidence: prediction.confidence ?? 1,
    detectedAt: new Date(),
    diseaseType: prediction.class?.disease_type || "unknown",
  };
}

/**
 * Calls the ML disease detection service with a plant image key; returns fallback "healthy" on failure
 * @param {{ key: string, userId: string, plantUUID: string, expectedPlant: string }} params - Detection parameters
 * @returns {Promise<{ prediction: { disease: string, confidence: number, detectedAt: string } }>} ML response or fallback
 */
async function detectDisease({ key, userId, plantUUID, expectedPlant }) {
  // 1. Validate S3 image key
  s3CloudService.validatePlantImageKey(key, plantUUID);

  // 2. Call ML disease detection service
  try {
    const response = await httpClient.post("/predict", {
      key,
      user_id: userId,
      plant_uuid: plantUUID,
      expected_plant: expectedPlant,
    });

    // 3. Return fallback healthy on ML service error
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
    // 4. Fallback to healthy on network/service failure
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
 * Simplifies the ML response into a user-friendly format with only essential fields
 * @param {{ prediction?: { class?: { disease?: string, plant?: string, disease_type?: string }, top_k?: Array, confidence?: number }, model?: { name: string, version: string } }} data - Raw ML response
 * @returns {{ disease: string, plant: string, confidence: number, disease_type: string, topPredictions: Array, model?: object }} Simplified detection result
 */
function simplifyDetectionResponse(data) {
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
    result.model = { name: data.model.name, version: data.model.version };
  }

  return result;
}

/**
 * Detects disease from a user-uploaded image (no associated plant record); returns simplified result
 * @param {{ key: string, userId: string }} params - Detection parameters
 * @returns {Promise<{ disease: string, plant: string, confidence: number, disease_type: string, topPredictions: Array }>} Simplified detection result
 */
export async function detectUserImageDisease({ key, userId }) {
  // 1. Validate user image key
  s3CloudService.validateUserImageKey(key);

  // 2. Call ML disease detection service
  try {
    const response = await httpClient.post("/predict", {
      key,
      user_id: userId,
    });

    // 3. Return fallback healthy on ML service error
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

    return simplifyDetectionResponse(response.data);
  } catch (error) {
    // 4. Fallback to healthy on network/service failure
    console.error("User image disease detection failed:", error.message);
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
 * Detects disease for a plant image and persists the result to the plant record (disease + history)
 * @param {{ key: string, userId: string, plantId: string, expectedPlant: string }} params - Detection and plant parameters
 * @returns {Promise<{ disease: object, diseaseHistory: Array, model?: object }>} Updated disease info and history
 * @throws {RouteError} 404 if plant not found
 */
export async function detectAndSaveDisease({ key, userId, plantId, expectedPlant }) {
  // 1. Call ML disease detection
  const mlResponse = await detectDisease({ key, userId, plantUUID: plantId, expectedPlant });
  // 2. Transform raw ML response into disease record
  const diseaseRecord = transformMlResponse(mlResponse);

  // 3. Load plant and apply disease delta via entity
  const plant = await plantRepo.findByUUID(plantId);
  if (!plant) throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found");
  const delta = plant.recordDiseaseDetection(diseaseRecord);
  // 4. Persist disease data to plant record
  const updatedPlant = await plantRepo.updateByUUID(plantId, delta);

  // 5. Return disease info and history
  const { disease, diseaseHistory } = updatedPlant;
  const result = { disease, diseaseHistory };
  if (mlResponse.model) {
    result.model = { name: mlResponse.model.name, version: mlResponse.model.version };
  }

  return result;
}
