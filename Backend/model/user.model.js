import mongoose from "../shared/db.js";
import { v4 as uuidv4 } from "uuid";

const userMongooseSchema = new mongoose.Schema({
  internalId: { type: Number, unique: true, default: () => Date.now() },
  uuid: { type: String, unique: true, default: () => uuidv4() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isVerified: { type: Boolean, default: false },
  refreshToken: { type: String, default: null },
  emailToken: { type: String, default: null },
  location: {
    city: String,
    coordinates: {
      lat: Number,
      lon: Number,
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model("User", userMongooseSchema);
