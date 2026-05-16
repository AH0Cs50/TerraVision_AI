import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const DiseaseSchema = z.object({
  name: z.string().default("healthy"),

  confidence: z.number().min(0).max(1).default(1),

  detectedAt: z.date().optional(),
});

/**
 * Simple DB schema (light validation)
 */
const PlantSchema = z.object({
  userInternalId: z.number(),

  name: z.string().min(2).max(100),

  varietyName: z.string().min(2).max(100),

  plantFamily: z.string(),

  plantType: z.enum(["crop", "tree"]),

  soilType: z.string().optional(),

  disease: DiseaseSchema,

  diseaseHistory: z.array(DiseaseSchema).default([]),
  /**
   * Farming date
   * From this date we can:
   * - calculate plant age
   * - estimate harvest time
   * - track growth progress
   */
  plantedAt: z.date(),

  expectedHarvestAt: z.date().optional(),

  lastWatered: z.date().optional(),

  cdn: z
    .object({
      basePath: z.string(), // the base path in bucket

      images: z.array(z.string()).optional(), // image file name
    })
    .optional(),
});

export const createPlantModel = (data) => {
  const parsed = PlantSchema.parse(data);

  const now = new Date();

  /**
   * Calculate age in days dynamically
   */
  const ageInDays = Math.floor(
    (now - parsed.plantedAt) / (1000 * 60 * 60 * 24),
  );

  return {
    internalId: Date.now(),

    uuid: uuidv4(),

    ...parsed,

    /**
     * Derived fields
     */
    ageInDays,

    hasDisease: parsed.disease.name !== "healthy",

    createdAt: now,

    updatedAt: now,
  };
};
