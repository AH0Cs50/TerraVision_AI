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

function transformMlResponse(mlResponse) {
  const prediction = mlResponse?.prediction;
  if (!prediction) {
    return { name: "healthy", confidence: 1, detectedAt: new Date() };
  }
  return {
    name: prediction.class?.disease || prediction.disease || "healthy",
    confidence: prediction.confidence ?? 1,
    detectedAt: new Date(),
  };
}

async function detectDisease({ key, userId, plantUUID, expectedPlant }) {
  s3CloudService.validatePlantImageKey(key);

  try {
    const response = await httpClient.post("/predict", {
      key,
      user_id: userId,
      plant_uuid: plantUUID,
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

export async function detectUserImageDisease({ key, userId }) {
  s3CloudService.validateUserImageKey(key);

  try {
    const response = await httpClient.post("/predict", {
      key,
      user_id: userId,
    });

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

export async function detectAndSaveDisease({ key, userId, plantId, expectedPlant }) {
  const mlResponse = await detectDisease({ key, userId, plantUUID: plantId, expectedPlant });
  const diseaseRecord = transformMlResponse(mlResponse);

  const plant = await plantRepo.findByUUID(plantId);
  if (!plant) throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found");
  const delta = plant.recordDiseaseDetection(diseaseRecord);
  const updatedPlant = await plantRepo.updateByUUID(plantId, delta);

  const { disease, diseaseHistory } = updatedPlant;
  const result = { disease, diseaseHistory };
  if (mlResponse.model) {
    result.model = { name: mlResponse.model.name, version: mlResponse.model.version };
  }

  return result;
}
