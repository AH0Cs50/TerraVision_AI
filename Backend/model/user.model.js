import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const locationSchema = z
  .object({
    city: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lon: z.number(),
      })
      .optional(),
    // future fields can be added here without breaking existing data
  })
  .optional();

//schema (validate)
export const UserSchema = z.object({
  name: z.string().min(2).max(100),

  email: z.string().email(),

  password: z.string().min(8),

  role: z.enum(["user", "admin"]).default("user"),

  isVerified: z.boolean().optional(),

  refreshToken: z.string().nullable().optional(),

  emailToken: z.string().nullable().optional(),

  location: locationSchema,
});

export const createUserModel = (data) => {
  const parsed = UserSchema.parse(data);

  return {
    internalId: Date.now(),

    uuid: uuidv4(),

    ...parsed,

    isVerified: parsed.isVerified ?? false,

    refreshToken: parsed.refreshToken ?? null,

    emailToken: parsed.refreshToken ?? null,

    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
