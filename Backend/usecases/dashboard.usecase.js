import {
  userRepo,
  dashboardService,
  plantCareAiInsights,
  actionLogRepo,
} from "../shared/container.js";

export async function getUserDashboard(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  const stats = await dashboardService.getUserStats(userDoc);

  const aiReport = await plantCareAiInsights.generateFarmReport(stats);

  const activityResult = await actionLogRepo.findByUserUUID(user.uuid, {
    page: 1,
    limit: 10,
  });

  return {
    ...stats,
    aiReport,
    recentActivity: activityResult.logs || [],
  };
}

export async function getUserStats(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  return dashboardService.getPlantStats(userDoc);
}

export async function getUserCareDistribution(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  return dashboardService.getCareDistribution(userDoc);
}

export async function getUserResourceDemand(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  return dashboardService.getResourceDemand(userDoc);
}

export async function getUserTaskEfficiency(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  return dashboardService.getTaskEfficiency(userDoc);
}

export async function getUserUpcomingHarvests(user, last = 3) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  const limit = Math.min(Math.max(parseInt(last) || 3, 1), 20);
  return dashboardService.getUpcomingHarvests(userDoc, limit);
}

export async function getUserAiReport(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  const stats = await dashboardService.getUserStats(userDoc);
  const report = await plantCareAiInsights.generateFarmReport(stats);
  return { aiReport: report };
}

export async function getUserRecentActivity(user, last = 10) {
  const limit = Math.min(Math.max(parseInt(last) || 10, 1), 100);
  const result = await actionLogRepo.findByUserUUID(user.uuid, {
    page: 1,
    limit,
  });
  return result.logs || [];
}
