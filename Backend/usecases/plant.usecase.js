import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import { fillPrompt } from "../infrastructure/service/llm.service.js";
import { GROWTH_STAGES } from "../model/plant.model.js";
import { userRepo, plantRepo, llmService, s3CloudService, plantCareActionLogger, actionLogRepo, plantCareStateService, plantVisionService, plantService } from "../shared/container.js";
import { detectAndSaveDisease, detectGeneralDisease as detectGeneralDiseaseFromMl } from "./disease-detection.usecase.js";

async function resolveUserInternalId(user) {
  if (user.internalId) return user.internalId;
  const userDoc = await userRepo.findByUUID(user.uuid);
  return userDoc.internalId;
}

function calcAgeDays(ageDays, plantedAt) {
  return ageDays ?? (plantedAt ? Math.floor((Date.now() - new Date(plantedAt).getTime()) / 86400000) : 0);
}

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

export async function getUserPlants(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  return await plantRepo.findByUserInternalId(userDoc.internalId);
}

export async function getPlant(plantUUID, user) {
  return await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
}

export async function createPlant(data, user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  const ageDays = calcAgeDays(data.ageDays, data.plantedAt);
  const dataWithAge = { ...data, ageDays };
  const growthStage = data.growthStage || (await deriveGrowthStage(dataWithAge));
  const expectedHarvestDate = data.expectedHarvestDate || (await deriveExpectedHarvestDate({ ...dataWithAge, growthStage }));
  const plant = await plantRepo.create({ ...dataWithAge, growthStage, expectedHarvestDate, userInternalId: userDoc.internalId });
  await plantCareActionLogger.logPlantCreated(plant.uuid, userDoc.uuid, userDoc.internalId, plant.internalId, "Plant created", { plantName: plant.name });
  return plant;
}

export async function updatePlant(plantUUID, user, updateData) {
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  const ageDays = calcAgeDays(updateData.ageDays, updateData.plantedAt || plant.plantedAt);
  const updated = await plantRepo.updateByUUID(plantUUID, { ...updateData, ageDays });
  if (!updated) throw new RouteError(HttpStatusCodes.NOT_FOUND, "Plant not found");
  await plantCareActionLogger.logPlantUpdated(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, "Plant updated", { updateFields: Object.keys(updateData) });
  return updated;
}

export async function deletePlant(plantUUID, user) {
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  const basePath = plant.cdn?.basePath || "";
  const images = plant.cdn?.images || [];
  await Promise.all(images.map((fileName) => s3CloudService.deleteFile(basePath + fileName)));
  await plantCareActionLogger.logPlantDeleted(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, "Plant deleted", { plantName: plant.name });
  await actionLogRepo.deleteByPlantUUID(plantUUID);
  await plantCareStateService.deleteByPlantUUID(plantUUID);
  await plantRepo.deleteByUUID(plantUUID);
}

export async function uploadPlantPhoto(plantUUID, user, fileName, fileType) {
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  const result = await s3CloudService.generateUploadUrl({ userId: user.uuid, plantId: plantUUID, fileName, fileType });
  const s3Key = result.key;
  const imageName = s3Key.substring(s3Key.lastIndexOf("/") + 1);

  const delta = plant.addImage(imageName);
  if (!plant.cdn?.images?.length) {
    Object.assign(delta, plant.setBasePath(s3Key.substring(0, s3Key.lastIndexOf("/") + 1)));
  }
  await plantRepo.updateByUUID(plantUUID, delta);

  await plantCareActionLogger.logImageUploaded(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, "Image uploaded", { fileName, s3Key });
  return result;
}

export async function detectPlantDisease(plantUUID, user, key) {
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  const fullKey = key.includes("/") ? key : (plant.cdn?.basePath || "") + key;
  const result = await detectAndSaveDisease({ key: fullKey, userId: user.uuid, plantId: plantUUID, expectedPlant: plant.commonName || plant.name });
  await plantCareActionLogger.logDiseaseDetected(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, "Disease detected", { disease: result.disease?.name || "unknown", confidence: result.disease?.confidence });
  return result;
}

export async function removePlantImage(plantUUID, user, key) {
  const plant = await plantService.verifyPlantAccess(plantUUID, user.uuid, user.role);
  const fullKey = key.includes("/") ? key : (plant.cdn?.basePath || "") + key;
  await s3CloudService.deleteFile(fullKey);
  const fileName = fullKey.substring(fullKey.lastIndexOf("/") + 1);

  const delta = plant.removeImage(fileName);
  if (delta["cdn.images"].length === 0) {
    Object.assign(delta, plant.setBasePath(""));
  }
  await plantRepo.updateByUUID(plantUUID, delta);

  await plantCareActionLogger.logImageRemoved(plantUUID, user.uuid, await resolveUserInternalId(user), plant.internalId, "Image removed", { key });
}

export async function extractPlantDataFromImage(key) {
  return await plantVisionService.extractImageData(key);
}

export async function uploadUserImage(user, fileName, fileType) {
  return await s3CloudService.generateUserUploadUrl({
    userId: user.uuid,
    fileName,
    fileType,
  });
}

export async function uploadGeneralImage(fileName, fileType) {
  return await s3CloudService.generateGeneralUploadUrl({
    fileName,
    fileType,
  });
}

export async function detectGeneralDisease(key) {
  return await detectGeneralDiseaseFromMl({ key });
}
