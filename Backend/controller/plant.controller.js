import {
  plantService,
  plantVisionService,
  s3CloudService,
  diseaseDetectionService,
  plantCareStateService,
  plantCareActionLogger,
  actionLogRepo,
} from "../shared/container.js";

import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import HttpResponse from "../shared/util/HttpResponse.js";
import RouteError from "../shared/util/RouteError.js";
import { PlantDTO } from "../dto/plant.dto.js";

export async function getUserPlants(req, res, next) {
  try {
    const plants = await plantService.getUserPlants(req.user.uuid);
    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Plants retrieved successfully", plants));
  } catch (error) {
    next(error);
  }
}

export async function getPlant(req, res, next) {
  try {
    const { id } = req.params;
    const plant = await plantService.verifyPlantAccess(
      id,
      req.user.uuid,
      req.user.role,
    );

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Plant retrieved successfully", plant));
  } catch (error) {
    next(error);
  }
}

export async function createPlant(req, res, next) {
  try {
    const parsed = PlantDTO.safeParse(req.body);
    if (!parsed.success) {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "Validation failed",
        parsed.error.errors,
      );
    }
    const plant = await plantService.createPlant(parsed.data, req.user.uuid);

    await plantCareActionLogger.logPlantCreated(plant.uuid, req.user, "Plant created", { plantName: plant.name });

    return res
      .status(HttpStatusCodes.CREATED)
      .json(
        HttpResponse.success(
          "Plant created successfully",
          plant,
          HttpStatusCodes.CREATED,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function uploadPlantPhoto(req, res, next) {
  try {
    const { id } = req.params;
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json(
          HttpResponse.error(
            "fileName and fileType are required",
            HttpStatusCodes.BAD_REQUEST,
          ),
        );
    }

    //check internally
    await plantService.verifyPlantAccess(id, req.user.uuid, req.user.role);

    const result = await s3CloudService.generateUploadUrl({
      userId: req.user.uuid,
      plantId: id,
      fileName,
      fileType,
    });

    await plantService.addImage(id, result.key);

    await plantCareActionLogger.logImageUploaded(id, req.user, "Image uploaded", { fileName, s3Key: result.key });

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Upload form generated", result));
  } catch (error) {
    next(error);
  }
}

export async function detectPlantDisease(req, res, next) {
  try {
    const { id } = req.params;
    const { key } = req.body;

    if (!key) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json(
          HttpResponse.error(
            "Image key is required",
            HttpStatusCodes.BAD_REQUEST,
          ),
        );
    }

    const plant = await plantService.verifyPlantAccess(
      id,
      req.user.uuid,
      req.user.role,
    );

    const fullKey = key.includes("/") ? key : (plant.cdn?.basePath || "") + key;

    const result = await diseaseDetectionService.detectAndSaveDisease({
      key: fullKey,
      userId: req.user.uuid,
      plantId: id,
      expectedPlant: plant.commonName || plant.name,
    });

    await plantCareActionLogger.logDiseaseDetected(id, req.user, "Disease detected", {
      disease: result.disease?.name || "unknown",
      confidence: result.disease?.confidence,
    });

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Disease detection completed", result));
  } catch (error) {
    next(error);
  }
}

export async function extractPlantDataFromImage(req, res, next) {
  try {
    const { id } = req.params;
    const { key } = req.body;

    if (!key) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json(
          HttpResponse.error(
            "Image key is required",
            HttpStatusCodes.BAD_REQUEST,
          ),
        );
    }

    await plantService.verifyPlantAccess(id, req.user.uuid, req.user.role);

    const extracted = await plantVisionService.extractPlantDataFromImage(
      id,
      key,
    );

    await plantCareActionLogger.logPlantDataExtracted(id, req.user, "Plant data extracted from image", { s3Key: key });

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Plant data extracted from image", extracted));
  } catch (error) {
    next(error);
  }
}

export async function uploadGeneralImage(req, res, next) {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json(
          HttpResponse.error(
            "fileName and fileType are required",
            HttpStatusCodes.BAD_REQUEST,
          ),
        );
    }

    const result = await s3CloudService.generateGeneralUploadUrl({
      fileName,
      fileType,
    });

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Upload form generated", result));
  } catch (error) {
    next(error);
  }
}

export async function detectGeneralDisease(req, res, next) {
  try {
    const { key } = req.body;

    if (!key) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json(
          HttpResponse.error(
            "Image key is required",
            HttpStatusCodes.BAD_REQUEST,
          ),
        );
    }

    const result = await diseaseDetectionService.detectGeneralDisease({ key });

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Disease detection completed", result));
  } catch (error) {
    next(error);
  }
}

export async function removePlantImage(req, res, next) {
  try {
    const { id } = req.params;
    const { key } = req.body;

    if (!key) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json(
          HttpResponse.error(
            "Image key is required",
            HttpStatusCodes.BAD_REQUEST,
          ),
        );
    }

    const plant = await plantService.verifyPlantAccess(
      id,
      req.user.uuid,
      req.user.role,
    );

    const fullKey = key.includes("/") ? key : (plant.cdn?.basePath || "") + key;
    await s3CloudService.deleteFile(fullKey);
    const removeResult = await plantService.removeImage(id, fullKey);

    if (!removeResult || removeResult === "nothing to remove") {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json(HttpResponse.error("Image not found", HttpStatusCodes.NOT_FOUND));
    }

    await plantCareActionLogger.logImageRemoved(id, req.user, "Image removed", { key });

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Image removed successfully"));
  } catch (error) {
    next(error);
  }
}

export async function updatePlant(req, res, next) {
  try {
    const { id } = req.params;

    await plantService.verifyPlantAccess(id, req.user.uuid, req.user.role);

    const parsed = PlantDTO.partial().safeParse(req.body);
    if (!parsed.success) {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "Validation failed",
        parsed.error.errors,
      );
    }

    const updated = await plantService.updatePlant(id, parsed.data);

    if (!updated) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json(HttpResponse.error("Plant not found", HttpStatusCodes.NOT_FOUND));
    }

    await plantCareActionLogger.logPlantUpdated(id, req.user, "Plant updated", { updateFields: Object.keys(parsed.data) });

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Plant updated successfully", updated));
  } catch (error) {
    next(error);
  }
}

export async function deletePlant(req, res, next) {
  try {
    const { id } = req.params;

    await plantService.verifyPlantAccess(id, req.user.uuid, req.user.role);

    const plant = await plantService.getPlantByUUID(id);

    const basePath = plant.cdn?.basePath || "";
    const images = plant.cdn?.images || [];
    await Promise.all(
      images.map((fileName) => s3CloudService.deleteFile(basePath + fileName)),
    );

    const plantName = plant.name;

    await plantCareActionLogger.logPlantDeleted(id, req.user, "Plant deleted", { plantName });
    await actionLogRepo.deleteByPlantUUID(id);
    await plantCareStateService.deleteByPlantUUID(id);
    await plantService.deletePlant(id);

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Plant deleted successfully"));
  } catch (error) {
    next(error);
  }
}
