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
