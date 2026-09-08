import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("auth-storage");
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${state.tokens.accessToken}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const stored = localStorage.getItem("auth-storage");
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.tokens?.refreshToken) {
            const { data } = await axios.post("/api/auth/refresh", {
              refreshToken: state.tokens.refreshToken,
            });
            const newTokens = data.tokens;
            const updatedState = { ...state, tokens: newTokens };
            localStorage.setItem("auth-storage", JSON.stringify({ state: updatedState }));
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch {
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
