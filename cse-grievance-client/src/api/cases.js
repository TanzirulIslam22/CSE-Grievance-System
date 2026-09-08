import api from "./client.js";

export async function getCases(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const { data } = await api.get(`/cases?${params.toString()}`);
  return data;
}

export async function getMyCases(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const { data } = await api.get(`/cases/my?${params.toString()}`);
  return data;
}

export async function getCaseById(id) {
  const { data } = await api.get(`/cases/${id}`);
  return data;
}

export async function createCase(payload) {
  const { data } = await api.post("/cases", payload);
  return data;
}

export async function updateCaseStatus(caseId, status, reason) {
  const { data } = await api.patch(`/cases/${caseId}/status`, { status, reason });
  return data;
}

export async function getCaseMessages(caseId) {
  const { data } = await api.get(`/cases/${caseId}/messages`);
  return data;
}

export async function sendCaseMessage(caseId, body) {
  const { data } = await api.post(`/cases/${caseId}/messages`, { body });
  return data;
}

export async function revealCaseIdentity(caseId) {
  const { data } = await api.post(`/cases/${caseId}/reveal-identity`);
  return data;
}
