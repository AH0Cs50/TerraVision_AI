import { Router } from "express";
import {
  analyzePlant,
  getCareState,
  getRecentLogs,
  addActionLog,
  getTasks,
  addTask,
  completeTask,
  generateAiInsights,
} from "../controller/plant-care.controller.js";

const router = Router();

router.post("/:id/analyze", analyzePlant);
router.get("/:id/care-state", getCareState);
router.get("/:id/logs", getRecentLogs);
router.post("/:id/logs", addActionLog);
router.get("/:id/tasks", getTasks);
router.post("/:id/tasks", addTask);
router.patch("/:id/tasks/complete", completeTask);
router.post("/:id/ai-insights", generateAiInsights);

export default router;
