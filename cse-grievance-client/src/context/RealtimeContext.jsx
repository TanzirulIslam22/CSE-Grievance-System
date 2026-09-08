import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext.jsx";

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const { accessToken, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = io("/", {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
    };

    socket.on("case:new", invalidateAll);
    socket.on("case:status", invalidateAll);
    socket.on("case:identity-revealed", invalidateAll);
    socket.on("case:message", () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    });
    socket.on("connect_error", () => {
      // silent — realtime is optional, REST polling still works
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, isAuthenticated, queryClient]);

  return (
    <RealtimeContext.Provider value={{ socket: socketRef }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}