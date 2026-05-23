import { Router } from "express";
import {
  getUserPlants,
  getPlant,
  createPlant,
  uploadPlantPhoto,
  detectPlantDisease,
  uploadGeneralImage,
  detectGeneralDisease,
  updatePlant,
  deletePlant,
  removePlantImage,
} from "../controller/plant.controller.js";

const router = Router();

router.get("", getUserPlants);
router.get("/:id", getPlant);

router.post("", createPlant);
router.post("/:id/upload", uploadPlantPhoto);
router.post("/:id/detect", detectPlantDisease);
router.post("/upload", uploadGeneralImage);
router.post("/detect", detectGeneralDisease);

router.put("/:id", updatePlant);

router.delete("/:id/images", removePlantImage);

router.delete("/:id", deletePlant);

export default router;
