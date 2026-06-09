import { Router } from "express";
import {
  getUserPlants,
  getPlant,
  createPlant,
  uploadPlantPhoto,
  detectPlantDisease,
  extractPlantDataFromImage,
  uploadGeneralImage,
  uploadUserImage,
  detectGeneralDisease,
  updatePlant,
  deletePlant,
  removePlantImage,
} from "../controller/plant.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Image routes — literal routes before /:id routes (Express 5 precedence)
router.post("/image/upload", uploadGeneralImage);           // public — general/images/...
router.post("/user/image/upload", authenticate, uploadUserImage); // auth — users/{userId}/images/...
router.post("/image/extract", authenticate, extractPlantDataFromImage); // auth — pre-plant extraction
router.post("/detect", detectGeneralDisease);               // public — general detection

router.get("", authenticate, getUserPlants);
router.get("/:id", authenticate, getPlant);

router.post("", authenticate, createPlant);
router.post("/:id/image/upload", authenticate, uploadPlantPhoto);
router.post("/:id/detect", authenticate, detectPlantDisease);

router.put("/:id", authenticate, updatePlant);
router.delete("/:id/images", authenticate, removePlantImage);
router.delete("/:id", authenticate, deletePlant);

export default router;
