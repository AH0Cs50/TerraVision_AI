import { Router } from "express";
import {
  analyzePlant,
  getCareState,
  getLogs,
  addActionLog,
  getTasks,
  generateAiInsights,
  waterPlant,
  fertilizePlant,
  harvestPlant,
  updateLight,
  treatDisease,
  prunePlant,
  getOverdueTasks,
  getPendingTasks,
  getPrioritizedTasks,
  clearOldLogs,
  askQuestion,
} from "../controller/plant-care.controller.js";

const router = Router();

// ── Analysis ────────────────────────────────────
router.post("/:id/analyze", analyzePlant);

// ── Care State ──────────────────────────────────
router.get("/:id/care-state", getCareState);

// ── Action Logs ─────────────────────────────────
router.get("/:id/logs", getLogs);
router.post("/:id/logs", addActionLog);
router.delete("/:id/logs", clearOldLogs);

// ── Quick Actions ───────────────────────────────
router.patch("/:id/water", waterPlant);
router.post("/:id/fertilize", fertilizePlant);
router.post("/:id/harvest", harvestPlant);
router.patch("/:id/light", updateLight);
router.post("/:id/treat-disease", treatDisease);
router.post("/:id/prune", prunePlant);

// ── Tasks (read-only views) ─────────────────────
router.get("/:id/tasks", getTasks);
router.get("/:id/tasks/overdue", getOverdueTasks);
router.get("/:id/tasks/pending", getPendingTasks);
router.get("/:id/tasks/prioritized", getPrioritizedTasks);

// ── AI Insights ────────────────────────────────
router.post("/:id/ai-insights", generateAiInsights);
router.post("/:id/ai-insights/ask", askQuestion);

export default router;
