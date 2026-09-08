import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(401).json({ error: "Invalid token" });
  }
}

export function loadUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  User.findById(req.user.userId)
    .populate("role")
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      req.userDoc = user;
      req.userRole = user.role;
      next();
    })
    .catch((err) => {
      next(err);
    });
}
