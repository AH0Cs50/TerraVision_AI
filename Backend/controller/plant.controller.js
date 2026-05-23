import {
  plantService,
  s3CloudService,
  diseaseDetectionService,
  plantRepo,
  plantCareStateService,
} from "../shared/container.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

export async function getUserPlants(req, res, next) {
  try {
    const plants = await plantService.getUserPlants(req.user.uuid);
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: plants,
    });
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

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: plant,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPlant(req, res, next) {
  try {
    const plant = await plantService.createPlant(req.body, req.user.uuid);
    return res.status(HttpStatusCodes.CREATED).json({
      success: true,
      message: "Plant created successfully",
      data: plant,
    });
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
        .json({ message: "fileName and fileType are required" });
    }

    //check internally
    const plant = await plantService.verifyPlantAccess(
      id,
      req.user.uuid,
      req.user.role,
    );

    const result = await s3CloudService.generateUploadUrl({
      userId: req.user.uuid,
      plantId: id,
      fileName,
      fileType,
    });

    await plantRepo.addImage(id, result.key);

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Upload URL generated",
      data: result,
    });
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
        .json({ message: "Image key is required" });
    }

    const plant = await plantService.verifyPlantAccess(
      id,
      req.user.uuid,
      req.user.role,
    );

    const mlResponse = await diseaseDetectionService.detectDisease({
      key,
      userId: req.user.uuid,
      plantId: id,
    });

    const updatedPlant = await diseaseDetectionService.updateDiseaseHistory(
      id,
      mlResponse,
    );

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Disease detection completed",
      data: updatedPlant,
    });
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
        .json({ message: "fileName and fileType are required" });
    }

    const result = await s3CloudService.generateGeneralUploadUrl({
      fileName,
      fileType,
    });

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Upload URL generated",
      data: result,
    });
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
        .json({ message: "Image key is required" });
    }

    const result = await diseaseDetectionService.detectGeneralDisease({ key });

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Disease detection completed",
      data: result,
    });
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
        .json({ message: "Image key is required" });
    }

    await plantService.verifyPlantAccess(id, req.user.uuid, req.user.role);

    await s3CloudService.deleteFile(key);
    await plantRepo.removeImage(id, key);

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Image removed successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePlant(req, res, next) {
  try {
    const { id } = req.params;

    const plant = await plantService.verifyPlantAccess(
      id,
      req.user.uuid,
      req.user.role,
    );

    const updated = await plantService.updatePlant(id, req.body);
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Plant updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePlant(req, res, next) {
  try {
    const { id } = req.params;

    await plantService.verifyPlantAccess(id, req.user.uuid, req.user.role);

    const plant = await plantService.getPlantByUUID(id);

    const images = plant.cdn?.images || [];
    await Promise.all(images.map((key) => s3CloudService.deleteFile(key).catch(() => {})));

    await plantCareStateService.deleteByPlantUUID(id);

    await plantService.deletePlant(id);

    return res.status(HttpStatusCodes.OK).json({
      success: true,
      message: "Plant deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
