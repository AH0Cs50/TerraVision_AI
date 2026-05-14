import { z } from "zod";

export const PlantDTO = z.object({

  userInternalId: z.number(),

  name: z.string().min(2).max(100),

  soilType: z.enum([
    "clay",
    "sandy",
    "loamy",
    "silty",
    "peaty",
    "chalky",
    "saline"
  ]).optional(),

  age: z.number().positive().optional(),

  ageType: z.enum(["days", "years"]).optional(),

  lastWatered: z.preprocess(
    (value) => {
      if (typeof value === "string" || typeof value === "number") {
        return new Date(value);
      }
  
      return value;
    },
    z.date().max(new Date()).optional()
  ),
  
})
.superRefine((data, ctx) => {
  
  // Rule 1: age must have type
  if (data.age && !data.ageType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "ageType is required when age is provided"
    });
  }

  // Rule 2: crop vs tree logic
  if (data.ageType === "days" && data.age > 365) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Crop age in days cannot exceed 365"
    });
  }

  if (data.ageType === "years" && data.age < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tree age in years must be >= 1"
    });
  }
});
