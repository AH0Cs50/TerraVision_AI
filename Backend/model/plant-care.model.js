import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

/**
 * =========================================
 * STATUS ENUMS
 * =========================================
 */

export const WATER_STATUSES = ["thirsty", "low", "satisfied", "overwatered"];

export const NUTRIENT_STATUSES = ["needs_feed", "low", "optimal", "excess"];

export const HEALTH_STATUSES = ["healthy", "warning", "diseased", "critical"];

export const LIGHT_STATUSES = ["low", "optimal", "high", "burn_risk"];

const WaterStatusEnum = z.enum(WATER_STATUSES);

const NutrientStatusEnum = z.enum(NUTRIENT_STATUSES);

const HealthStatusEnum = z.enum(HEALTH_STATUSES);

const LightStatusEnum = z.enum(LIGHT_STATUSES);

/**
 * =========================================
 * PLANT STATUS
 * =========================================
 */

const PlantStatusSchema = z.object({
  water: WaterStatusEnum,

  nutrients: NutrientStatusEnum,

  health: HealthStatusEnum,

  light: LightStatusEnum,
});

/**
 * =========================================
 * ENGINE SCORES (raw numeric output)
 * =========================================
 */

const AppliedRuleSchema = z.object({
  id: z.string(),
  layer: z.string(),
  explainKey: z.string(),
});

export const EngineScoresSchema = z.object({
  waterScore: z.number().min(0.5).max(2.0),
  fertilizerScore: z.number().min(0.5).max(2.0),
  pestRiskScore: z.number().min(0.5).max(2.0),
  lightScore: z.number().min(0.5).max(2.0),
  appliedRules: z.array(AppliedRuleSchema).default([]),
});

/**
 * =========================================
 * TASK
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

const PlantTaskSchema = z.object({
  taskId: z.string().default(uuidv4),

  type: z.enum(TASK_TYPES),

  title: z.string(),

  description: z.string().optional(),

  priority: z.enum(TASK_PRIORITIES).default("medium"),

  status: z.enum(TASK_STATUSES).default("pending"),

  generatedBy: z.enum(TASK_GENERATED_BY).default("ai"),

  createdAt: z.date(),

  dueDate: z.date().optional(),

  completedAt: z.date().optional(),
});

/**
 * =========================================
 * ACTION LOG
 * =========================================
 */

export const ACTION_TYPES = [
  "watered",
  "fertilized",
  "disease_scan",
  "task_completed",
  "task_added",
  "task_updated",
  "task_cancelled",
  "light_changed",
  "harvested",
];

const PlantActionLogSchema = z.object({
  logId: z.string().default(uuidv4),

  actionType: z.enum(ACTION_TYPES),

  description: z.string(),

  metadata: z.object({}).passthrough().optional(),

  createdAt: z.date(),
});

/**
 * =========================================
 * AI INSIGHTS
 * =========================================
 */

const PlantAIInsightsSchema = z.object({
  summary: z.string(),

  recommendations: z.array(z.string()).default([]),

  generatedAt: z.date(),
});

/**
 * =========================================
 * MAIN MODEL
 * =========================================
 */

export const PlantCareStateSchema = z.object({
  plantUUID: z.string(),

  status: PlantStatusSchema,

  engineScores: EngineScoresSchema.optional(),

  activeTasks: z.array(PlantTaskSchema).default([]),

  completedTasks: z.array(PlantTaskSchema).default([]),

  actionLogs: z.array(PlantActionLogSchema).default([]),

  aiInsights: PlantAIInsightsSchema.optional(),

  updatedAt: z.date(),
});

export function createPlantTaskModel(data) {
  const parsed = PlantTaskSchema.parse(data);

  const now = new Date();

  return {
    taskId: parsed.taskId || uuidv4(),

    type: parsed.type,

    title: parsed.title,

    description: parsed.description,

    priority: parsed.priority || "medium",

    status: parsed.status || "pending",

    generatedBy: parsed.generatedBy || "ai",

    createdAt: parsed.createdAt || now,

    dueDate: parsed.dueDate,

    completedAt: parsed.completedAt,
  };
}

/**
 * =========================================
 * SCORE MAPPING
 * =========================================
 * Maps numeric engine scores (0.5–2.0) to categorical status enums.
 */

function mapWaterStatus(score) {
  if (score >= 1.7) return "overwatered";
  if (score >= 1.3) return "satisfied";
  if (score >= 0.8) return "low";
  return "thirsty";
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
  const parsed = PlantCareStateSchema.parse(data);

  const now = new Date();

  const activeTasks = parsed.activeTasks.map((task) => ({
    taskId: task.taskId || uuidv4(),

    ...task,

    createdAt: task.createdAt || now,
  }));

  const completedTasks = parsed.completedTasks.map((task) => ({
    taskId: task.taskId || uuidv4(),

    ...task,

    createdAt: task.createdAt || now,

    completedAt: task.completedAt || now,
  }));

  const actionLogs = parsed.actionLogs.map((log) => ({
    logId: log.logId || uuidv4(),

    ...log,

    createdAt: log.createdAt || now,
  }));

  return {
    internalId: Date.now(),

    uuid: uuidv4(),

    plantUUID: parsed.plantUUID,

    status: parsed.status,

    engineScores: parsed.engineScores,

    activeTasks,

    completedTasks,

    actionLogs,

    aiInsights: parsed.aiInsights
      ? {
          ...parsed.aiInsights,

          recommendations: parsed.aiInsights.recommendations || [],

          generatedAt: parsed.aiInsights.generatedAt || now,
        }
      : undefined,

    createdAt: now,

    updatedAt: now,
  };
}
