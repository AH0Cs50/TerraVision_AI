import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const DiseaseSchema = z.object({
    name: z.string().default("healthy"),
  
    confidence: z.number().min(0).max(1).default(1),
  
    detectedAt: z.date().optional()
});

/**
 * Simple DB schema (light validation)
 */
const PlantSchema = z.object({
  userInternalId: z.number(), // FK (IMPORTANT)

  name: z.string().min(2).max(100),

  plantType: z.enum([
    "crop",
    "tree"
  ]),

  soilType: z.string().optional(),

  disease: DiseaseSchema.default({
    name: "healthy",
    confidence: 1,
  }),

  age: z.number().optional(), // flexible (days or years)

  ageType: z.enum(["days", "years"]).optional(),

  lastWatered: z.date().optional(),

  cdn: z.object({
    basePath: z.string(), // app/user_id/plant_id/
    images: z.array(z.string()).optional()
  }).optional()
});

export const createPlantModel = (data) => {
  const parsed = PlantSchema.parse(data);

  const now = new Date();

  return {
    internalId: Date.now(), // simple ID for relations 
    uuid: uuidv4(),         // public ID

    ...parsed, //validated data

    // normalize defaults
    hasDisease: parsed.disease.name !== 'healthy',

    createdAt: now,
    updatedAt: now
  };
};
