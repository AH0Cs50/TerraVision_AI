import { z } from "zod";
import { v4 as uuidv4 } from "uuid";


//schema (validate)
export const UserSchema = z.object({
  name: z.string().min(2).max(100),

  email: z.string().email(),

  password: z.string().min(8),

  role: z.enum(["user", "admin"]).default("user"),

  isVerified: z.boolean().optional(),

  refreshToken: z.string().nullable().optional(),

  location:  z.object({}).passthrough() // allow any keys (city / coordinates / future)
  .optional()
});

export const createUserModel = (data) => {

  const parsed = UserSchema.parse(data);

  return {
    internalId: Date.now(),

    uuid: uuidv4(),

    ...parsed,

    isVerified: parsed.isVerified ?? false,

    refreshToken: parsed.refreshToken ?? null,

    createdAt: new Date(),
    updatedAt: new Date()
  };
};