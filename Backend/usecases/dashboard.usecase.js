import {
  userRepo,
  dashboardService,
  plantCareAiInsights,
  actionLogRepo,
} from "../shared/container.js";

/**
 * Assembles the full dashboard for a user: stats, AI farm report, and recent activity
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<{ stats: object, aiReport: object, recentActivity: Array }>} Dashboard data
 */
export async function getUserDashboard(user) {
  // 1. Fetch user document
  const userDoc = await userRepo.findByUUID(user.uuid);
  // 2. Gather aggregate plant statistics
  const stats = await dashboardService.getUserStats(userDoc);

  // 3. Generate AI farm report from stats
  const aiReport = await plantCareAiInsights.generateFarmReport(stats);

  // 4. Fetch recent activity across all plants
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

/**
 * Retrieves aggregate plant statistics for the authenticated user
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<object>} Plant statistics (total, healthy, diseased, etc.)
 */
export async function getUserStats(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  return dashboardService.getPlantStats(userDoc);
}

/**
 * Retrieves the care-status distribution across all of the user's plants
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<object>} Care distribution data
 */
export async function getUserCareDistribution(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  return dashboardService.getCareDistribution(userDoc);
}

/**
 * Retrieves resource demand forecast (water, fertilizer, etc.) for the user's plants
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<object>} Resource demand data
 */
export async function getUserResourceDemand(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  return dashboardService.getResourceDemand(userDoc);
}

/**
 * Retrieves task completion efficiency metrics for the user
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<object>} Task efficiency metrics
 */
export async function getUserTaskEfficiency(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  return dashboardService.getTaskEfficiency(userDoc);
}

/**
 * Retrieves upcoming harvests sorted by date, limited to a configurable count
 * @param {{ uuid: string }} user - Authenticated user
 * @param {number} [last=3] - Maximum number of harvests to return (1-20)
 * @returns {Promise<Array>} Array of upcoming harvest entries
 */
export async function getUserUpcomingHarvests(user, last = 3) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  const limit = Math.min(Math.max(parseInt(last) || 3, 1), 20);
  return dashboardService.getUpcomingHarvests(userDoc, limit);
}

/**
 * Generates an AI-powered farm report for the user based on plant statistics
 * @param {{ uuid: string }} user - Authenticated user
 * @returns {Promise<{ aiReport: object }>} AI-generated farm report
 */
export async function getUserAiReport(user) {
  const userDoc = await userRepo.findByUUID(user.uuid);
  const stats = await dashboardService.getUserStats(userDoc);
  const report = await plantCareAiInsights.generateFarmReport(stats);
  return { aiReport: report };
}

/**
 * Retrieves the most recent action log entries for the user across all their plants
 * @param {{ uuid: string }} user - Authenticated user
 * @param {number} [last=10] - Maximum number of activity entries to return (1-100)
 * @returns {Promise<Array>} Array of recent activity log entries
 */
export async function getUserRecentActivity(user, last = 10) {
  const limit = Math.min(Math.max(parseInt(last) || 10, 1), 100);
  const result = await actionLogRepo.findByUserUUID(user.uuid, {
    page: 1,
    limit,
  });
  return result.logs || [];
}
