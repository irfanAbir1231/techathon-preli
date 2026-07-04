import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { startDiscordBot } from "./bot.js";
import {
  getSimulationStatus,
  getOfficeSnapshot,
  getRoomState,
  pauseSimulation,
  runAlertDetection,
  resumeSimulation,
  setSimulationRunning,
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

let discordBot = null;
let isShuttingDown = false;

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const broadcastDashboardUpdate = (snapshot = getOfficeSnapshot()) => {
  io.emit("dashboard-update", snapshot);
};

const publishDashboardUpdate = (snapshot = getOfficeSnapshot()) => {
  broadcastDashboardUpdate(snapshot);
  void discordBot?.notifyNewAlerts(snapshot.alerts);
};

app.get("/api/status", (req, res) => {
  console.log("[API] GET /api/status");
  res.status(200).json(getOfficeSnapshot());
});

app.get("/api/simulation", (req, res) => {
  console.log("[API] GET /api/simulation");
  res.status(200).json(getSimulationStatus());
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
  publishDashboardUpdate(snapshot);

  res.status(200).json({
    message: "Device toggled successfully",
    device: updatedDevice,
    snapshot
  });
});

const respondWithSimulationState = (res, message, previousStatus) => {
  const snapshot = getOfficeSnapshot();

  if (previousStatus?.isRunning !== snapshot.simulation.isRunning) {
    publishDashboardUpdate(snapshot);
  }

  res.status(200).json({
    message,
    simulation: snapshot.simulation,
    snapshot
  });
};

app.post("/api/simulation/pause", (req, res) => {
  console.log("[API] POST /api/simulation/pause");
  const previousStatus = getSimulationStatus();
  pauseSimulation();
  respondWithSimulationState(res, "Simulation paused", previousStatus);
});

app.post("/api/simulation/resume", (req, res) => {
  console.log("[API] POST /api/simulation/resume");
  const previousStatus = getSimulationStatus();
  resumeSimulation(publishDashboardUpdate);
  respondWithSimulationState(res, "Simulation resumed", previousStatus);
});

app.post("/api/simulation/toggle", (req, res) => {
  console.log("[API] POST /api/simulation/toggle");
  const previousStatus = getSimulationStatus();
  const nextStatus = setSimulationRunning(!previousStatus.isRunning);
  const message = nextStatus.isRunning
    ? "Simulation resumed"
    : "Simulation paused";
  respondWithSimulationState(res, message, previousStatus);
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

  if (discordBot) {
    await discordBot.shutdown();
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

  startSimulation(publishDashboardUpdate);
  startAlertEngine(publishDashboardUpdate);

  discordBot = await startDiscordBot({
    token: process.env.DISCORD_TOKEN,
    alertChannelId: process.env.DISCORD_ALERT_CHANNEL_ID,
    groqApiKey: process.env.GROQ_API_KEY,
    getSnapshot: getOfficeSnapshot,
    getRoomState
  });
});
