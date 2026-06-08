import { Router } from "express";
import {
  getUserPlants,
  getPlant,
  createPlant,
  uploadPlantPhoto,
  detectPlantDisease,
  extractPlantDataFromImage,
  uploadGeneralImage,
  detectGeneralDisease,
  updatePlant,
  deletePlant,
  removePlantImage,
} from "../controller/plant.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// General routes (no auth) — must be BEFORE parameterized routes
router.post("/image/upload", uploadGeneralImage);
router.post("/detect", detectGeneralDisease);

router.get("", authenticate, getUserPlants);
router.get("/:id", authenticate, getPlant);

router.post("", authenticate, createPlant);
router.post("/:id/upload", authenticate, uploadPlantPhoto);
router.post("/:id/image/upload", authenticate, uploadPlantPhoto);
router.post("/:id/image/extract", authenticate, extractPlantDataFromImage);
router.post("/:id/detect", authenticate, detectPlantDisease);

router.put("/:id", authenticate, updatePlant);
router.delete("/:id/images", authenticate, removePlantImage);
router.delete("/:id", authenticate, deletePlant);

export default router;
