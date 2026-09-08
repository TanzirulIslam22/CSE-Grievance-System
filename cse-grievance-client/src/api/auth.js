import api from "./client.js";

export async function loginUser(email, password, extra = {}) {
  const { data } = await api.post("/auth/login", { email, password, ...extra });
  return data;
}

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function getCaptchaStatus() {
  const { data } = await api.get("/auth/captcha-status");
  return data;
}

export async function getCaptcha() {
  const { data } = await api.get("/auth/captcha");
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post("/auth/reset-password", { token, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function getPreferences() {
  const { data } = await api.get("/auth/me/preferences");
  return data.preferences;
}

export async function updatePreferences(prefs) {
  const { data } = await api.patch("/auth/me/preferences", prefs);
  return data.preferences;
}

export async function refreshTokens(refreshToken) {
  const { data } = await api.post("/auth/refresh", { refreshToken });
  return data;
}
