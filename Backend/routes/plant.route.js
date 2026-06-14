import { Router } from "express";
import {
  uploadUserImage,
  detectUserImageDisease,
  extractPlantDataFromImage,
  getUserPlants,
  getPlant,
  createPlant,
  uploadPlantPhoto,
  detectPlantDisease,
  updatePlant,
  removePlantImage,
  deletePlant,
} from "../controller/plant.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Literal routes (before :id to avoid param capture) ──────────────
router.post("/user/image/upload", authenticate, uploadUserImage);
router.post("/user/image/detect", authenticate, detectUserImageDisease);
router.post("/image/extract", authenticate, extractPlantDataFromImage);

// ── Read ────────────────────────────────────────────────────────────
router.get("", authenticate, getUserPlants);
router.get("/:id", authenticate, getPlant);

// ── Create ──────────────────────────────────────────────────────────
router.post("", authenticate, createPlant);

// ── Plant-scoped image + detection ──────────────────────────────────
router.post("/:id/image/upload", authenticate, uploadPlantPhoto);
router.post("/:id/detect", authenticate, detectPlantDisease);

// ── Update ──────────────────────────────────────────────────────────
router.put("/:id", authenticate, updatePlant);

// ── Delete ──────────────────────────────────────────────────────────
router.delete("/:id/images", authenticate, removePlantImage);
router.delete("/:id", authenticate, deletePlant);

export default router;
