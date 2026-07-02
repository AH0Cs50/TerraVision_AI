import { Router } from "express";
import {
  getUserDashboard,
  getUserStatsHandler,
  getUserCareDistributionHandler,
  getUserResourceDemandHandler,
  getUserTaskEfficiencyHandler,
  getUserUpcomingHarvestsHandler,
  getUserAiReportHandler,
  getUserWeatherHandler,
  getUserRecentActivity,
} from "../controller/dashboard.controller.js";

const router = Router();

router.get("/", getUserDashboard);
router.get("/stats", getUserStatsHandler);
router.get("/care", getUserCareDistributionHandler);
router.get("/resource-demand", getUserResourceDemandHandler);
router.get("/task-efficiency", getUserTaskEfficiencyHandler);
router.get("/harvests", getUserUpcomingHarvestsHandler);
router.get("/ai-report", getUserAiReportHandler);
router.get("/weather", getUserWeatherHandler);
router.get("/activity", getUserRecentActivity);

export default router;
