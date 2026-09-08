import api from "./client.js";

export async function getAnalyticsSummary() {
  const { data } = await api.get("/analytics/summary");
  return data;
}