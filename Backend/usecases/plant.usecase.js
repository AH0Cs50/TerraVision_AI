import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { fillPrompt } from "../infrastructure/service/llm.service.js";
import { GROWTH_STAGES } from "../model/plant.model.js";
import { userRepo, plantRepo, llmService, s3CloudService, plantCareActionLogger, actionLogRepo, plantCareStateService, plantVisionService, plantService } from "../shared/container.js";
import { detectAndSaveDisease, detectUserImageDisease as detectUserImageDiseaseFromMl } from "./disease-detection.usecase.js";

/**
 * Resolves a user's internalId from their auth object or database
 * @param {{ uuid: string, internalId?: number }} user - Authenticated user
 * @returns {Promise<number>} The user's internal ID
 */
async function resolveUserInternalId(user) {
  if (user.internalId) return user.internalId;
  const userDoc = await userRepo.findByUUID(user.uuid);
  return userDoc.internalId;
}

/**
 * Calculates the age of a plant in days from the planted date or provided value
 * @param {number|null|undefined} ageDays - Pre-calculated age in days
 * @param {string|Date|null|undefined} plantedAt - Date the plant was planted
 * @returns {number} Age in days (0 if neither is available)
 */
function calcAgeDays(ageDays, plantedAt) {
  return ageDays ?? (plantedAt ? Math.floor((Date.now() - new Date(plantedAt).getTime()) / 86400000) : 0);
}

/**
 * Uses LLM to derive the plant's growth stage based on its details; falls back to provided stage or "vegetative"
 * @param {{ name: string, commonName?: string, family: string, category: string, ageDays?: number, growthStage?: string }} data - Plant data
 * @returns {Promise<string>} Derived growth stage from GROWTH_STAGES enum
 */
async function deriveGrowthStage(data) {
  if (!llmService) return data.growthStage || "vegetative";
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
    const response = await llmService.generateResponse(prompt);
    const stage = typeof response === "string" ? response.trim().toLowerCase() : "";
    return GROWTH_STAGES.includes(stage) ? stage : data.growthStage || "vegetative";
  } catch {
    return data.growthStage || "vegetative";
  }
}

/**
 * Uses LLM to estimate the expected harvest date; falls back to category-based default (crop=90d, flower=60d, tree=365d)
 * @param {{ name: string, commonName?: string, family: string, category: string, plantedAt?: string, growthStage?: string }} data - Plant data
 * @returns {Promise<Date|null>} Expected harvest date or null if plantedAt is missing
 */
async function deriveExpectedHarvestDate(data) {
  if (llmService) {
    try {
      const prompt = fillPrompt("HARVEST_DATE", {
        plantName: data.name,
        commonName: data.commonName || "not specified",
        family: data.family,
        category: data.category,
        plantedAt: data.plantedAt ? new Date(data.plantedAt).toISOString() : "unknown",
        growthStage: data.growthStage || "unknown",
      });
      const response = await llmService.generateResponse(prompt);
      const dateStr = typeof response === "string" ? response.trim() : "";
      const parsed = new Date(dateStr);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    } catch { /* fall through */ }
  }
  if (!data.plantedAt) return null;
  const fallbackDays = { crop: 90, flower: 60, tree: 365 };
  const days = fallbackDays[data.category] || 90;
  return new Date(new Date(data.plantedAt).getTime() + days * 86400000);
}

/**
 * Retrieves all plants belonging to the authenticated user
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<Array>} Array of plant documents
 */
export async function getUserPlants(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  return await plantRepo.findByUserInternalId(userDoc.internalId);
}

/**
 * Retrieves a single plant by UUID with ownership/role verification
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @returns {Promise<object>} Plant entity
 * @throws {RouteError} 404 if plant not found or access denied
 */
export async function getPlant(plantUUID, user) {
  return await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
}

/**
 * Creates a new plant, deriving growth stage and harvest date via LLM if not provided
 * @param {{ name: string, commonName?: string, family: string, category: string, plantedAt?: string, ageDays?: number, growthStage?: string, expectedHarvestDate?: string, soil?: object }} data - Plant creation data
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<object>} Created plant document
 */
export async function createPlant(data, user) {
  // 1. Resolve user document
  const userDoc = await userRepo.findByUUID(user.uuid);
  // 2. Calculate plant age in days
  const ageDays = calcAgeDays(data.ageDays, data.plantedAt);
  const dataWithAge = { ...data, ageDays };
  // 3. Derive growth stage and harvest date via LLM
  const growthStage = data.growthStage || (await deriveGrowthStage(dataWithAge));
  const expectedHarvestDate = data.expectedHarvestDate || (await deriveExpectedHarvestDate({ ...dataWithAge, growthStage }));
  // 4. Persist plant to database
  const plant = await plantRepo.create({ ...dataWithAge, growthStage, expectedHarvestDate, userInternalId: userDoc.internalId });
  // 5. Log creation action
  await plantCareActionLogger.logPlantCreated(plant.uuid, userDoc.uuid, userDoc.internalId, plant.internalId, "Plant created", { plantName: plant.name });
  return plant;
}

/**
 * Updates a plant's fields with ownership/role verification and re-calculates age
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} Updated plant document
 * @throws {RouteError} 404 if plant not found after update
 */
export async function updatePlant(plantUUID, user, updateData) {
  // 1. Verify plant access
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  // 2. Re-calculate age with new or existing planted date
  const ageDays = calcAgeDays(updateData.ageDays, updateData.plantedAt || plant.plantedAt);
  // 3. Persist updates to database
  const updated = await plantRepo.updateByUUID(plantUUID, { ...updateData, ageDays });
  if (!updated) throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found");
  // 4. Log update action
  await plantCareActionLogger.logPlantUpdated(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, "Plant updated", { updateFields: Object.keys(updateData) });
  return updated;
}

/**
 * Deletes a plant, its S3 images, action logs, care state, and logged actions
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 */
export async function deletePlant(plantUUID, user) {
  // 1. Verify plant access
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  // 2. Delete all S3 images
  const basePath = plant.cdn?.basePath || "";
  const images = plant.cdn?.images || [];
  await Promise.all(images.map((fileName) => s3CloudService.deleteFile(basePath + fileName)));
  // 3. Log deletion action
  await plantCareActionLogger.logPlantDeleted(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, "Plant deleted", { plantName: plant.name });
  // 4. Clean up action logs and care state
  await actionLogRepo.deleteByPlantUUID(plantUUID);
  await plantCareStateService.deleteByPlantUUID(plantUUID);
  // 5. Remove plant record
  await plantRepo.deleteByUUID(plantUUID);
}

/**
 * Generates a pre-signed S3 upload URL for a plant image and registers it in the plant record
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @param {string} fileName - Desired file name
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<{ url: string, key: string }>} Pre-signed upload URL and S3 key
 */
export async function uploadPlantPhoto(plantUUID, user, fileName, fileType) {
  // 1. Verify plant access
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  // 2. Generate pre-signed S3 upload URL
  const result = await s3CloudService.generateUploadUrl({ userId: user.uuid, plantId: plantUUID, fileName, fileType });
  // 3. Parse S3 key to extract image name
  const s3Key = result.key;
  const imageName = s3Key.substring(s3Key.lastIndexOf("/") + 1);

  // 4. Apply add-image delta via entity
  const delta = plant.addImage(imageName);
  if (!plant.cdn?.images?.length) {
    Object.assign(delta, plant.setBasePath(s3Key.substring(0, s3Key.lastIndexOf("/") + 1)));
  }
  // 5. Persist delta to plant record
  await plantRepo.updateByUUID(plantUUID, delta);

  // 6. Log upload action
  await plantCareActionLogger.logImageUploaded(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, "Image uploaded", { fileName, s3Key });
  return result;
}

/**
 * Runs disease detection on a plant image via the ML service and saves the result
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @param {string} key - S3 key of the image to analyze
 * @returns {Promise<{ disease: object, diseaseHistory: Array }>} Detection result and updated history
 */
export async function detectPlantDisease(plantUUID, user, key) {
  // 1. Verify plant access
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  // 2. Build full S3 key
  const fullKey = key.includes("/") ? key : (plant.cdn?.basePath || "") + key;
  // 3. Run ML disease detection and persist result
  const result = await detectAndSaveDisease({ key: fullKey, userId: user.uuid, plantId: plantUUID, expectedPlant: plant.commonName || plant.name });
  // 4. Log detection action
  await plantCareActionLogger.logDiseaseDetected(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, "Disease detected", { disease: result.disease?.name || "unknown", confidence: result.disease?.confidence });
  return result;
}

/**
 * Deletes an image from S3 and removes its reference from the plant record
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @param {string} key - S3 key of the image to remove
 */
export async function removePlantImage(plantUUID, user, key) {
  // 1. Verify plant access
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  // 2. Build full S3 key and delete from S3
  const fullKey = key.includes("/") ? key : (plant.cdn?.basePath || "") + key;
  await s3CloudService.deleteFile(fullKey);
  // 3. Build remove-image delta via entity
  const fileName = fullKey.substring(fullKey.lastIndexOf("/") + 1);

  const delta = plant.removeImage(fileName);
  if (delta["cdn.images"].length === 0) {
    Object.assign(delta, plant.setBasePath(""));
  }
  // 4. Persist delta to plant record
  await plantRepo.updateByUUID(plantUUID, delta);

  // 5. Log removal action
  await plantCareActionLogger.logImageRemoved(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, "Image removed", { key });
}

/**
 * Extracts plant data (name, family, category) from an image using the vision service
 * @param {string} key - S3 key of the image
 * @returns {Promise<object>} Extracted plant data from vision AI
 */
export async function extractPlantDataFromImage(key) {
  return await plantVisionService.extractImageData(key);
}

/**
 * Detects disease from a user-uploaded image (not tied to a specific plant)
 * @param {string} key - S3 key of the user image
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<{ disease: string, plant: string, confidence: number, disease_type: string, topPredictions: Array }>} Simplified detection result
 */
export async function detectUserImageDisease(key, user) {
  return await detectUserImageDiseaseFromMl({ key, userId: user.uuid });
}

/**
 * Generates a pre-signed S3 upload URL for a user-uploaded image (not plant-specific)
 * @param {{ uuid: string }} user - Authenticated user
 * @param {string} fileName - Desired file name
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<{ url: string, key: string }>} Pre-signed upload URL and S3 key
 */
export async function uploadUserImage(user, fileName, fileType) {
  return await s3CloudService.generateUserUploadUrl({
    userId: user.uuid,
    fileName,
    fileType,
  });
}

/**
 * Generates a pre-signed GET URL for a single plant image
 * @param {string} plantUUID - Plant's UUID
 * @param {{ uuid: string, role: string }} user - Authenticated user
 * @param {string} imageName - Image filename (from cdn.images)
 * @returns {Promise<string>} Pre-signed download URL
 * @throws {RouteError} 404 if image not found on plant
 */
export async function getPlantImageUrl(plantUUID, user, imageName) {
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  if (!plant.cdn?.images?.includes(imageName)) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "Image not found on plant");
  }
  const fullKey = (plant.cdn.basePath || "") + imageName;
  return await s3CloudService.generateGetUrl(fullKey);
}


