import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";

let io = null;

export function attachIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.userId).populate("role");
      if (!user) return next(new Error("User not found"));

      socket.data.userId = decoded.userId;
      socket.data.roleName = user.role ? user.role.name : null;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }
    if (socket.data.roleName) {
      socket.join(`role:${socket.data.roleName}`);
    }
  });

  return io;
}

export function getIO() {
  return io;
}

function emit(event, payload) {
  if (io) io.emit(event, payload);
}

export function emitToRole(roleName, event, payload) {
  if (io) io.to(`role:${roleName}`).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${userId}`).emit(event, payload);
}

export { emit };