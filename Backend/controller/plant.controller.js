import * as PlantUseCases from "../usecases/plant.usecase.js";

import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import HttpResponse from "../shared/util/HttpResponse.js";
import RouteError from "../shared/util/RouteError.js";
import { PlantDTO } from "../dto/plant.dto.js";

export async function getUserPlants(req, res, next) {
  try {
    const plants = await PlantUseCases.getUserPlants(req.user);
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
    const plant = await PlantUseCases.getPlant(id, req.user);

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
    const plant = await PlantUseCases.createPlant(parsed.data, req.user);

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

    const result = await PlantUseCases.uploadPlantPhoto(
      id,
      req.user,
      fileName,
      fileType,
    );

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

    const result = await PlantUseCases.detectPlantDisease(id, req.user, key);

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Disease detection completed", result));
  } catch (error) {
    next(error);
  }
}

export async function extractPlantDataFromImage(req, res, next) {
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

    const extracted = await PlantUseCases.extractPlantDataFromImage(key);

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Plant data extracted from image", extracted));
  } catch (error) {
    next(error);
  }
}

export async function detectUserImageDisease(req, res, next) {
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

    const result = await PlantUseCases.detectUserImageDisease(key, req.user);

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Disease detection completed", result));
  } catch (error) {
    next(error);
  }
}

export async function uploadUserImage(req, res, next) {
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

    const result = await PlantUseCases.uploadUserImage(
      req.user,
      fileName,
      fileType,
    );

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Upload form generated", result));
  } catch (error) {
    next(error);
  }
}



export async function getPlantImage(req, res, next) {
  try {
    const { id, imageName } = req.params;
    const url = await PlantUseCases.getPlantImageUrl(id, req.user, imageName);
    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Image URL generated", { url }));
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

    const result = await PlantUseCases.removePlantImage(id, req.user, key);

    if (result === "nothing to remove") {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json(HttpResponse.error("Image not found", HttpStatusCodes.NOT_FOUND));
    }

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

    const parsed = PlantDTO.partial().safeParse(req.body);
    if (!parsed.success) {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "Validation failed",
        parsed.error.errors,
      );
    }

    const updated = await PlantUseCases.updatePlant(id, req.user, parsed.data);

    if (!updated) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json(HttpResponse.error("Plant not found", HttpStatusCodes.NOT_FOUND));
    }

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

    await PlantUseCases.deletePlant(id, req.user);

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Plant deleted successfully"));
  } catch (error) {
    next(error);
  }
}
