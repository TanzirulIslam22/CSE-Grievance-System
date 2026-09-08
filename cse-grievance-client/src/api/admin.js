import api from "./client.js";

export async function getUsers(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.append(key, String(value));
  });
  const { data } = await api.get(`/admin/users?${params.toString()}`);
  return data;
}

export async function getRoles() {
  const { data } = await api.get("/admin/roles");
  return data;
}

export async function changeUserRole(userId, role) {
  const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
  return data;
}

export async function getAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.append(key, String(value));
  });
  const { data } = await api.get(`/audit?${params.toString()}`);
  return data;
}

export async function getConfig() {
  const { data } = await api.get("/admin/config");
  return data;
}

export async function updateConfig(values) {
  const { data } = await api.patch("/admin/config", { values });
  return data;
}
