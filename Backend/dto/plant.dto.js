import { z } from "zod";
import { FAMILIES, GROWTH_STAGES, SOIL_TYPES } from "../model/plant.model.js";

const PlantFamilyEnum = z.enum(FAMILIES);

const GrowthStageEnum = z.enum(GROWTH_STAGES);

const SoilTypeEnum = z.enum(SOIL_TYPES);

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

  growthStage: GrowthStageEnum.optional(),

  commonName: z.string().min(2).max(100).optional(),

  category: z.enum(["crop", "tree", "flower"]),

  family: PlantFamilyEnum,

  plantedAt: z.preprocess(parseDate, z.date()),

  soil: z.object({
    type: SoilTypeEnum,
    moisture: z.number().min(0).max(100).nullable().optional(),
  }),

  hasDisease: z.boolean().optional(),

  stress: z
    .object({
      diseaseType: z.enum(["bacterial", "fungal", "viral", "none"]),
      severity: z.enum(["healthy", "medium", "critical"]),
    })
    .optional(),

  coverImage: z.string().optional(),

  watering: z
    .object({
      hoursSinceLastWatering: z.number().min(0),
    })
    .optional(),
});
