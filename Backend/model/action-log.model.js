import mongoose from "../shared/db.js";
import { v4 as uuidv4 } from "uuid";

export const ACTION_TYPES = [
  "watered",
  "fertilized",
  "disease_scan",
  "disease_detected",
  "task_completed",
  "task_added",
  "task_updated",
  "task_cancelled",
  "light_changed",
  "harvested",
  "plant_analysis",
  "plant_created",
  "plant_updated",
  "plant_deleted",
  "image_uploaded",
  "image_removed",
  "plant_data_extracted",
  "insight_generated",
];

const actionLogMongooseSchema = new mongoose.Schema({
  logId: { type: String, default: () => uuidv4() },
  plantUUID: { type: String, required: true },
  plantInternalId: { type: Number, required: true },
  userUUID: { type: String, required: true },
  userInternalId: { type: Number, required: true },
  actionType: { type: String, enum: ACTION_TYPES, required: true },
  description: { type: String, required: true },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

actionLogMongooseSchema.index({ plantInternalId: 1, createdAt: -1 });
actionLogMongooseSchema.index({ userInternalId: 1, createdAt: -1 });
actionLogMongooseSchema.index({ plantUUID: 1, createdAt: -1 });

export const ActionLogModel = mongoose.model("ActionLog", actionLogMongooseSchema);
