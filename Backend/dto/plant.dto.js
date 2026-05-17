import { z } from "zod";

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

function parseDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  return value;
}

export const PlantDTO = z.object({
  name: z.string().min(2).max(100),

  varietyName: z.string().min(2).max(100),

  plantType: z.enum(["crop", "tree"]),

  family: PlantFamilyEnum,

  growthStage: GrowthStageEnum,

  plantedAt: z.preprocess(parseDate, z.date()),

  soil: z.object({
    type: SoilTypeEnum,
    moisture: z.number().min(0).max(100),
  }),

  watering: z
    .object({
      hoursSinceLastWatering: z.number().min(0),
    })
    .optional(),

  stress: z
    .object({
      diseaseType: StressDiseaseTypeEnum,
      severity: StressSeverityEnum,
    })
    .optional(),
});
