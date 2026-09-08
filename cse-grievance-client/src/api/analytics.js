import api from "./client.js";

export async function getAnalyticsSummary() {
  const { data } = await api.get("/analytics/summary");
  return data;
}

export async function sendWeeklyReport() {
  const { data } = await api.post("/analytics/report");
  return data;
}