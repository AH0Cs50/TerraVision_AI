import mongoose from "../shared/db.js";
import { v4 as uuidv4 } from "uuid";
import { ACTION_TYPES } from "./action-log.model.js";

/**
 * =========================================
 * STATUS ENUMS
 * =========================================
 */

export const WATER_STATUSES = ["thirsty", "low", "satisfied", "overwatered"];

export const NUTRIENT_STATUSES = ["needs_feed", "low", "optimal", "excess"];

export const HEALTH_STATUSES = ["healthy", "warning", "diseased", "critical"];

export const LIGHT_STATUSES = ["low", "optimal", "high", "burn_risk"];

/**
 * =========================================
 * TASK ENUMS
 * =========================================
 */

export const TASK_TYPES = [
  "watering",
  "fertilizing",
  "pruning",
  "disease_treatment",
  "move_light",
  "harvest",
];

export const TASK_PRIORITIES = ["low", "medium", "high"];

export const TASK_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];

export const TASK_GENERATED_BY = ["ai", "system", "user"];

export { ACTION_TYPES } from "./action-log.model.js";

export function createPlantTaskModel(data) {
  if (!TASK_TYPES.includes(data.type)) {
    throw new Error("Invalid task type: " + data.type);
  }

  const now = new Date();

  return {
    taskId: data.taskId || uuidv4(),

    type: data.type,

    title: data.title,

    description: data.description,

    priority: data.priority || "medium",

    status: data.status || "pending",

    generatedBy: data.generatedBy || "ai",

    createdAt: data.createdAt || now,

    dueDate: data.dueDate,

    completedAt: data.completedAt,
  };
}

/**
 * =========================================
 * SCORE MAPPING
 * =========================================
 * Maps numeric engine scores (0.5–2.0) to categorical status enums.
 */

function mapWaterStatus(score) {
  if (score >= 1.7) return "thirsty";
  if (score >= 1.3) return "low";
  if (score >= 0.8) return "satisfied";
  return "overwatered";
}

function mapNutrientStatus(score) {
  if (score >= 1.7) return "excess";
  if (score >= 1.3) return "optimal";
  if (score >= 0.8) return "low";
  return "needs_feed";
}

function mapHealthStatus(score) {
  if (score >= 1.7) return "critical";
  if (score >= 1.3) return "diseased";
  if (score >= 0.8) return "warning";
  return "healthy";
}

function mapLightStatus(score) {
  if (score >= 1.7) return "burn_risk";
  if (score >= 1.3) return "high";
  if (score >= 0.8) return "optimal";
  return "low";
}

export function engineScoresToStatus(scores) {
  return {
    water: mapWaterStatus(scores.waterScore),
    nutrients: mapNutrientStatus(scores.fertilizerScore),
    health: mapHealthStatus(scores.pestRiskScore),
    light: mapLightStatus(scores.lightScore),
  };
}

export function buildEngineScores(engineResult) {
  return {
    waterScore: engineResult.waterScore,
    fertilizerScore: engineResult.fertilizerScore,
    pestRiskScore: engineResult.pestRiskScore,
    lightScore: engineResult.lightScore,
    appliedRules: engineResult._appliedRules || [],
  };
}

export function createPlantCareStateModel(data) {
  const now = new Date();

  const activeTasks = (data.activeTasks || []).map((task) => ({
    taskId: task.taskId || uuidv4(),

    ...task,

    createdAt: task.createdAt || now,
  }));

  const completedTasks = (data.completedTasks || []).map((task) => ({
    taskId: task.taskId || uuidv4(),

    ...task,

    createdAt: task.createdAt || now,

    completedAt: task.completedAt || now,
  }));

  return {
    internalId: Date.now(),

    uuid: uuidv4(),

    plantUUID: data.plantUUID,

    status: data.status,

    engineScores: data.engineScores,

    activeTasks,

    completedTasks,

    aiInsights: data.aiInsights
      ? {
          ...data.aiInsights,

          recommendations: data.aiInsights.recommendations || [],

          generatedAt: data.aiInsights.generatedAt || now,
        }
      : undefined,

    createdAt: now,

    updatedAt: now,
  };
}

// ── Mongoose Schemas ─────────────────────────────────────────────

const statusSubSchema = new mongoose.Schema(
  {
    water: { type: String, enum: WATER_STATUSES, required: true },
    nutrients: { type: String, enum: NUTRIENT_STATUSES, required: true },
    health: { type: String, enum: HEALTH_STATUSES, required: true },
    light: { type: String, enum: LIGHT_STATUSES, required: true },
  },
  { _id: false },
);

const appliedRuleSubSchema = new mongoose.Schema(
  {
    id: String,
    layer: String,
    explainKey: String,
  },
  { _id: false },
);

const engineScoresSubSchema = new mongoose.Schema(
  {
    waterScore: { type: Number },
    fertilizerScore: { type: Number },
    pestRiskScore: { type: Number },
    lightScore: { type: Number },
    appliedRules: { type: [appliedRuleSubSchema], default: [] },
  },
  { _id: false },
);

const plantTaskSubSchema = new mongoose.Schema(
  {
    taskId: { type: String, default: () => uuidv4() },
    type: { type: String, enum: TASK_TYPES, required: true },
    title: { type: String, required: true },
    description: String,
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
    status: { type: String, enum: TASK_STATUSES, default: "pending" },
    generatedBy: { type: String, enum: TASK_GENERATED_BY, default: "ai" },
    createdAt: { type: Date, default: Date.now },
    dueDate: Date,
    completedAt: Date,
  },
  { _id: false },
);

const aiInsightsSubSchema = new mongoose.Schema(
  {
    summary: { type: String, required: true },
    recommendations: { type: [String], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const plantCareMongooseSchema = new mongoose.Schema({
  internalId: { type: Number, unique: true, default: () => Date.now() },
  uuid: { type: String, unique: true, default: () => uuidv4() },
  plantUUID: { type: String, required: true },
  status: { type: statusSubSchema, required: true },
  engineScores: engineScoresSubSchema,
  activeTasks: { type: [plantTaskSubSchema], default: [] },
  completedTasks: { type: [plantTaskSubSchema], default: [] },
  aiInsights: aiInsightsSubSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const PlantCareModel = mongoose.model(
  "PlantCare",
  plantCareMongooseSchema,
);
