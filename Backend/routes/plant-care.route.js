import { Router } from "express";
import {
  analyzePlant,
  getCareState,
  getLogs,
  addActionLog,
  getTasks,
  addTask,
  completeTask,
  generateAiInsights,
  waterPlant,
  fertilizePlant,
  harvestPlant,
  updateLight,
  cancelTask,
  reopenTask,
  generateTasks,
  getOverdueTasks,
  getPendingTasks,
  getPrioritizedTasks,
  removeCompletedTasks,
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

// ── Tasks — literal paths first ────────────────
router.get("/:id/tasks", getTasks);
router.post("/:id/tasks", addTask);
router.post("/:id/tasks/generate", generateTasks);
router.get("/:id/tasks/overdue", getOverdueTasks);
router.get("/:id/tasks/pending", getPendingTasks);
router.get("/:id/tasks/prioritized", getPrioritizedTasks);
router.patch("/:id/tasks/complete", completeTask);
router.delete("/:id/tasks/completed", removeCompletedTasks);

// ── Tasks — parameterised paths ────────────────
router.patch("/:id/tasks/:taskId/cancel", cancelTask);
router.patch("/:id/tasks/:taskId/reopen", reopenTask);

// ── AI Insights ────────────────────────────────
router.post("/:id/ai-insights", generateAiInsights);
router.post("/:id/ai-insights/ask", askQuestion);

export default router;
