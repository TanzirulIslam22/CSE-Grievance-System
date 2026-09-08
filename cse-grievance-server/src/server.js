import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { config } from "./config/index.js";
import { attachIO } from "./realtime/io.js";
import { startEscalationJob } from "./jobs/escalationJob.js";

async function start() {
  await connectDB();

  const server = http.createServer(app);
  attachIO(server);

  startEscalationJob();

  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`Realtime (socket.io) enabled`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});