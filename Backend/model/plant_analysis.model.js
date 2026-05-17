import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

/**
 * =========================================
 * STATUS ENUMS
 * =========================================
 */

const WaterStatusEnum = z.enum(["thirsty", "low", "satisfied", "overwatered"]);

const NutrientStatusEnum = z.enum(["needs_feed", "low", "optimal", "excess"]);

const HealthStatusEnum = z.enum(["healthy", "warning", "diseased", "critical"]);

const LightStatusEnum = z.enum(["low", "optimal", "high", "burn_risk"]);

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
 * TASK
 * =========================================
 */

const PlantTaskSchema = z.object({
  taskId: z.string().default(uuidv4),

  type: z.enum([
    "watering",
    "fertilizing",
    "pruning",
    "disease_treatment",
    "move_light",
    "harvest",
  ]),

  title: z.string(),

  description: z.string().optional(),

  priority: z.enum(["low", "medium", "high"]).default("medium"),

  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .default("pending"),

  generatedBy: z.enum(["ai", "system", "user"]).default("ai"),

  createdAt: z.date(),

  dueDate: z.date().optional(),

  completedAt: z.date().optional(),
});

/**
 * =========================================
 * ACTION LOG
 * =========================================
 */

const PlantActionLogSchema = z.object({
  logId: z.string().default(uuidv4),

  actionType: z.enum([
    "watered",
    "fertilized",
    "disease_scan",
    "task_completed",
    "light_changed",
    "harvested",
  ]),

  description: z.string(),

  metadata: z.object({}).passthrough().optional(),

  createdAt: z.date(),
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
  status: PlantStatusSchema,

  engineScores: EngineScoresSchema.optional(),

  activeTasks: z.array(PlantTaskSchema).default([]),

  actionLogs: z.array(PlantActionLogSchema).default([]),

  aiInsights: PlantAIInsightsSchema,

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

/**
 * Convert engine evaluation result to plant care state status.
 */
export function engineScoresToStatus(scores) {
  return {
    water: mapWaterStatus(scores.waterScore),
    nutrients: mapNutrientStatus(scores.fertilizerScore),
    health: mapHealthStatus(scores.pestRiskScore),
    light: mapLightStatus(scores.lightScore),
  };
}

/**
 * Build raw engine scores object from engine output.
 * Renames _appliedRules → appliedRules for the model.
 */
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

  const actionLogs = parsed.actionLogs.map((log) => ({
    logId: log.logId || uuidv4(),

    ...log,

    createdAt: log.createdAt || now,
  }));

  return {
    internalId: Date.now(),

    uuid: uuidv4(),

    status: parsed.status,

    activeTasks,

    actionLogs,

    aiInsights: {
      ...parsed.aiInsights,

      recommendations: parsed.aiInsights.recommendations || [],

      generatedAt: parsed.aiInsights.generatedAt || now,
    },

    createdAt: now,

    updatedAt: now,
  };
}
