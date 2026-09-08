import mongoose from "mongoose";
import { config } from "./index.js";

export async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("MongoDB connected: " + mongoose.connection.host);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB runtime error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting reconnect...");
  });
}
