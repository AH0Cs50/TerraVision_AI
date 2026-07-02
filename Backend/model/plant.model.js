import mongoose from "../shared/db.js";
import { v4 as uuidv4 } from "uuid";

export const FAMILIES = [
  "leafy_greens",
  "fruiting_nightshade",
  "succulent",
  "root_crops",
  "brassicas",
  "legumes",
  "herbs",
  "tropical",
  "citrus",
  "vines",
  "grasses",
  "flowering_ornamentals",
];

export const GROWTH_STAGES = [
  "germination",
  "seedling",
  "vegetative",
  "flowering",
  "fruiting",
  "mature",
];

export const SOIL_TYPES = [
  "sandy",
  "alfisols",
  "aridisols",
  "entisols",
  "inceptisols",
  "vertisols",
];

const DISEASE_TYPES = ["bacterial", "fungal", "none"];
const SEVERITIES = ["high", "medium", "none"];

const diseaseSubSchema = new mongoose.Schema(
  {
    name: { type: String, default: "healthy" },
    confidence: { type: Number, default: 1 },
    detectedAt: Date,
  },
  { _id: false },
);

const plantMongooseSchema = new mongoose.Schema({
  internalId: { type: Number, unique: true, default: () => Date.now() },
  uuid: { type: String, unique: true, default: () => uuidv4() },
  userInternalId: { type: Number, required: true },
  name: { type: String, required: true },
  commonName: { type: String },
  category: { type: String, enum: ["crop", "tree", "flower"], required: true },
  family: { type: String, enum: FAMILIES, required: true },
  growthStage: { type: String, enum: GROWTH_STAGES, required: true },
  plantedAt: { type: Date, required: true },
  expectedHarvestDate: Date,
  soil: {
    type: { type: String, enum: SOIL_TYPES },
    moisture: { type: Number, min: 0, max: 100 },
    lastFertilized: { type: Date },
    lastPruned: { type: Date },
  },
  watering: {
    hoursSinceLastWatering: { type: Number, min: 0 },
  },
  disease: {
    type: diseaseSubSchema,
    default: () => ({ name: "healthy", confidence: 1 }),
  },
  stress: {
    diseaseType: { type: String, enum: DISEASE_TYPES },
    severity: { type: String, enum: SEVERITIES },
  },
  diseaseHistory: { type: [diseaseSubSchema], default: [] },
  cdn: {
    basePath: String,
    images: [String],
  },
  coverImage: { type: String },
  ageDays: Number,
  hasDisease: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const PlantModel = mongoose.model("Plant", plantMongooseSchema);
