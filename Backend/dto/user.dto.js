import { z } from "zod";

// =========================
// Sub-schemas
// =========================

const CoordinatesDTO = z.object({
  lat: z
    .number({ invalid_type_error: "Latitude must be a number" })
    .min(-90, "Latitude must be >= -90")
    .max(90, "Latitude must be <= 90"),

  lon: z
    .number({ invalid_type_error: "Longitude must be a number" })
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180"),
});

const CityDTO = z
  .string()
  .trim()
  .min(2, "City must be at least 2 characters")
  .max(120, "City must be at most 120 characters")
  .regex(/^[a-zA-Z\s-]+$/, "City contains invalid characters");

// =========================
// Location DTO (XOR logic)
// =========================

export const LocationDTO = z
  .object({
    city: CityDTO.optional(),
    coordinates: CoordinatesDTO.optional(),
  })
  .refine((data) => data.city || data.coordinates, {
    message: "Either city or coordinates must be provided",
    path: ["location"],
  })
  .refine((data) => !(data.city && data.coordinates), {
    message: "Provide either city OR coordinates, not both",
    path: ["location"],
  });

// =========================
// User DTO
// =========================

export const UserDTO = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name too short")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email format"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),

  role: z.enum(["user", "admin"]).default("user"),

  location: LocationDTO.optional(),
});
