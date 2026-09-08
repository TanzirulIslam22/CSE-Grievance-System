import * as analyticsService from "../services/analyticsService.js";

export async function getAnalyticsSummary(_req, res, next) {
  try {
    const summary = await analyticsService.getAnalyticsSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
}