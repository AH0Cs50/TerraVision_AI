import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

function parseDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  return value;
}

const PlantFamilyEnum = z.enum([
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
]);

const GrowthStageEnum = z.enum([
  "germination",
  "seedling",
  "vegetative",
  "flowering",
  "fruiting",
  "mature",
]);

const SoilTypeEnum = z.enum([
  "sandy",
  "alfisols",
  "aridisols",
  "entisols",
  "inceptisols",
  "vertisols",
]);

const StressDiseaseTypeEnum = z.enum(["bacterial", "fungal", "none"]);
const StressSeverityEnum = z.enum(["high", "medium", "none"]);

export const DiseaseSchema = z.object({
  name: z.string().default("healthy"),
  confidence: z.number().min(0).max(1).default(1),
  detectedAt: z.date().optional(),
});

const PlantSchema = z.object({
  userInternalId: z.number(),

  name: z.string().min(2).max(100),

  varietyName: z.string().min(2).max(100),

  plantType: z.enum(["crop", "tree"]),

  family: PlantFamilyEnum,

  growthStage: GrowthStageEnum,

  plantedAt: z.preprocess(parseDate, z.date()),

  expectedHarvestDate: z.preprocess(parseDate, z.date()).optional(),

  soil: z
    .object({
      type: SoilTypeEnum,
      moisture: z.number().min(0).max(100).optional(),
    })
    .optional(),

  watering: z
    .object({
      hoursSinceLastWatering: z.number().min(0),
    })
    .optional(),

  disease: DiseaseSchema.default({
    name: "healthy",
    confidence: 1,
    detectedAt: new Date(),
  }),

  stress: z
    .object({
      diseaseType: StressDiseaseTypeEnum,
      severity: StressSeverityEnum.optional(),
    })
    .optional(),

  diseaseHistory: z.array(DiseaseSchema).default([]),

  cdn: z
    .object({
      basePath: z.string(),
      images: z.array(z.string()).optional(),
    })
    .optional(),
});

export const createPlantModel = (data) => {
  const parsed = PlantSchema.parse(data);
  const now = new Date();
  const ageDays = Math.floor((now - parsed.plantedAt) / (1000 * 60 * 60 * 24));

  return {
    internalId: Date.now(),
    uuid: uuidv4(),
    ...parsed,
    ageDays,
    hasDisease: parsed.disease.name !== "healthy",
    createdAt: now,
    updatedAt: now,
  };
};
