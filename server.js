import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { startDiscordBot } from "./bot.js";
import {
  getOfficeSnapshot,
  getRoomState,
  runAlertDetection,
  startAlertEngine,
  startSimulation,
  stopSimulation,
  toggleDeviceById
} from "./simulation.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN
  }
});

let discordClient = null;
let isShuttingDown = false;

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const broadcastDashboardUpdate = (snapshot = getOfficeSnapshot()) => {
  io.emit("dashboard-update", snapshot);
};

app.get("/api/status", (req, res) => {
  console.log("[API] GET /api/status");
  res.status(200).json(getOfficeSnapshot());
});

app.get("/api/room/:roomName", (req, res) => {
  const { roomName } = req.params;
  console.log(`[API] GET /api/room/${roomName}`);

  const roomState = getRoomState(roomName);

  if (!roomState) {
    res.status(404).json({
      error: "Room not found",
      validRooms: ["drawing", "work1", "work2"]
    });
    return;
  }

  res.status(200).json(roomState);
});

app.post("/api/device/toggle", (req, res) => {
  console.log("[API] POST /api/device/toggle");

  const id = req.body?.id;
  if (typeof id !== "string" || id.trim() === "") {
    res.status(400).json({ error: "A valid device id is required" });
    return;
  }

  const normalizedId = id.trim().toUpperCase();
  const updatedDevice = toggleDeviceById(normalizedId);

  if (!updatedDevice) {
    res.status(404).json({ error: "Device not found" });
    return;
  }

  console.log(`[API] Manual toggle ${updatedDevice.id} -> ${updatedDevice.status}`);
  runAlertDetection();

  const snapshot = getOfficeSnapshot();
  broadcastDashboardUpdate(snapshot);

  res.status(200).json({
    message: "Device toggled successfully",
    device: updatedDevice,
    snapshot
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error("[Server] Express error", error);

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
});

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  socket.emit("dashboard-update", getOfficeSnapshot());

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`[Server] Graceful shutdown started (${signal})`);

  stopSimulation();

  if (discordClient) {
    discordClient.destroy();
    console.log("[Discord] Client destroyed");
  }

  await new Promise((resolve) => {
    io.close(() => {
      console.log("[Socket] Server closed");
      resolve();
    });
  });

  await new Promise((resolve) => {
    httpServer.close(() => {
      console.log("[Server] HTTP server closed");
      resolve();
    });
  });

  process.exit(0);
};

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

httpServer.on("error", (error) => {
  console.error(`[Server] HTTP server error: ${error.message}`);
  process.exit(1);
});

httpServer.listen(PORT, async () => {
  console.log(`[Server] Listening on port ${PORT}`);

  startSimulation(broadcastDashboardUpdate);
  startAlertEngine(broadcastDashboardUpdate);

  discordClient = await startDiscordBot({
    getSnapshot: getOfficeSnapshot,
    getRoomState
  });
});
