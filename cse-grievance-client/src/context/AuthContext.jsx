import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, getMe } from "../api/auth.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "auth-storage";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state || null;
  } catch {
    return null;
  }
}

function saveState(state) {
  if (state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(loadState);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const stored = loadState();
      if (stored?.tokens?.accessToken) {
        try {
          const { user: u } = await getMe();
          setUser(u);
          setAuthState(stored);
        } catch {
          setAuthState(null);
          setUser(null);
          saveState(null);
        }
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const login = useCallback(async (email, password, extra = {}) => {
    const result = await loginUser(email, password, extra);
    setAuthState(result);
    setUser(result.user);
    saveState(result);
  }, []);

  const register = useCallback(async (payload) => {
    const result = await registerUser(payload);
    setAuthState(result);
    setUser(result.user);
    saveState(result);
  }, []);

  const logout = useCallback(() => {
    setAuthState(null);
    setUser(null);
    saveState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: authState?.tokens?.accessToken || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
