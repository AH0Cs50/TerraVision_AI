import * as DashboardUseCases from "../usecases/dashboard.usecase.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";
import HttpResponse from "../shared/util/HttpResponse.js";

export async function getUserDashboard(req, res, next) {
  try {
    const dashboard = await DashboardUseCases.getUserDashboard(req.user);

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Dashboard data retrieved successfully", dashboard));
  } catch (error) {
    next(error);
  }
}

export async function getUserStatsHandler(req, res, next) {
  try {
    const data = await DashboardUseCases.getUserStats(req.user);
    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Plant statistics retrieved successfully", data));
  } catch (error) {
    next(error);
  }
}

export async function getUserCareDistributionHandler(req, res, next) {
  try {
    const data = await DashboardUseCases.getUserCareDistribution(req.user);
    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Care distribution retrieved successfully", data));
  } catch (error) {
    next(error);
  }
}

export async function getUserResourceDemandHandler(req, res, next) {
  try {
    const data = await DashboardUseCases.getUserResourceDemand(req.user);
    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Resource demand retrieved successfully", data));
  } catch (error) {
    next(error);
  }
}

export async function getUserTaskEfficiencyHandler(req, res, next) {
  try {
    const data = await DashboardUseCases.getUserTaskEfficiency(req.user);
    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Task efficiency retrieved successfully", data));
  } catch (error) {
    next(error);
  }
}

export async function getUserUpcomingHarvestsHandler(req, res, next) {
  try {
    const { last } = req.query;
    const data = await DashboardUseCases.getUserUpcomingHarvests(req.user, last);
    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Upcoming harvests retrieved successfully", data));
  } catch (error) {
    next(error);
  }
}

export async function getUserAiReportHandler(req, res, next) {
  try {
    const data = await DashboardUseCases.getUserAiReport(req.user);
    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("AI farm report retrieved successfully", data));
  } catch (error) {
    next(error);
  }
}

export async function getUserRecentActivity(req, res, next) {
  try {
    const { last } = req.query;
    const logs = await DashboardUseCases.getUserRecentActivity(req.user, last);

    return res
      .status(HttpStatusCodes.OK)
      .json(HttpResponse.success("Recent activity retrieved successfully", { logs }));
  } catch (error) {
    next(error);
  }
}
