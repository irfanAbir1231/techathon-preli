import { randomUUID } from "node:crypto";

export const ROOM_NAMES = ["Drawing Room", "Work Room 1", "Work Room 2"];

export const RATED_POWER = {
  fan: 60,
  light: 15
};

const DEVICE_CONFIG = [
  ["DR_F1", "Drawing Room", "fan"],
  ["DR_F2", "Drawing Room", "fan"],
  ["DR_L1", "Drawing Room", "light"],
  ["DR_L2", "Drawing Room", "light"],
  ["DR_L3", "Drawing Room", "light"],
  ["WR1_F1", "Work Room 1", "fan"],
  ["WR1_F2", "Work Room 1", "fan"],
  ["WR1_L1", "Work Room 1", "light"],
  ["WR1_L2", "Work Room 1", "light"],
  ["WR1_L3", "Work Room 1", "light"],
  ["WR2_F1", "Work Room 2", "fan"],
  ["WR2_F2", "Work Room 2", "fan"],
  ["WR2_L1", "Work Room 2", "light"],
  ["WR2_L2", "Work Room 2", "light"],
  ["WR2_L3", "Work Room 2", "light"]
];

const ROOM_ALIASES = new Map([
  ["drawing", "Drawing Room"],
  ["drawing-room", "Drawing Room"],
  ["drawing room", "Drawing Room"],
  ["dr", "Drawing Room"],
  ["work1", "Work Room 1"],
  ["work-room-1", "Work Room 1"],
  ["work room 1", "Work Room 1"],
  ["wr1", "Work Room 1"],
  ["work2", "Work Room 2"],
  ["work-room-2", "Work Room 2"],
  ["work room 2", "Work Room 2"],
  ["wr2", "Work Room 2"]
]);

const OFFICE_START_HOUR = 9;
const OFFICE_END_HOUR = 17;
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const SIMULATION_INTERVAL_MS = 15 * 1000;

let simulationInterval = null;
let alertInterval = null;
let simulationUpdateHandler = null;
let lastSimulationTick = null;

export const officeState = DEVICE_CONFIG.map(([id, room, type]) => ({
  id,
  room,
  type,
  status: "OFF",
  powerDraw: 0,
  lastChanged: new Date().toISOString()
}));

const activeAlertsByKey = new Map();

const cloneDevice = (device) => ({ ...device });

const cloneAlert = (alert) => ({
  id: alert.id,
  type: alert.type,
  message: alert.message,
  timestamp: alert.timestamp
});

const getDeviceLabel = (device) => {
  const [, rawNumber = ""] = device.id.split("_");
  const number = rawNumber.replace(/^[A-Z]+/, "");
  const typeLabel = device.type === "fan" ? "Fan" : "Light";
  return `${device.room} ${typeLabel} ${number}`;
};

const getRoomDevices = (roomName) =>
  officeState.filter((device) => device.room === roomName);

export const normalizeRoomName = (roomName) => {
  if (typeof roomName !== "string") {
    return null;
  }

  const normalized = roomName.trim().toLowerCase();
  return ROOM_ALIASES.get(normalized) ?? null;
};

export const getTotalPowerUsage = () =>
  officeState.reduce((total, device) => total + device.powerDraw, 0);

export const getRoomPowerUsage = () =>
  ROOM_NAMES.reduce((usage, roomName) => {
    usage[roomName] = getRoomDevices(roomName).reduce(
      (total, device) => total + device.powerDraw,
      0
    );
    return usage;
  }, {});

export const getSimulationStatus = () => ({
  isRunning: Boolean(simulationInterval),
  intervalMs: SIMULATION_INTERVAL_MS,
  lastTick: lastSimulationTick
});

export const getOfficeSnapshot = () => ({
  officeState: officeState.map(cloneDevice),
  totalPowerUsage: getTotalPowerUsage(),
  roomPowerUsage: getRoomPowerUsage(),
  alerts: Array.from(activeAlertsByKey.values()).map(cloneAlert),
  simulation: getSimulationStatus(),
  updatedAt: new Date().toISOString()
});

export const getRoomState = (roomName) => {
  const normalizedRoomName = normalizeRoomName(roomName);

  if (!normalizedRoomName) {
    return null;
  }

  const devices = getRoomDevices(normalizedRoomName);

  return {
    room: normalizedRoomName,
    devices: devices.map(cloneDevice),
    activeDeviceCount: devices.filter((device) => device.status === "ON").length,
    totalDeviceCount: devices.length,
    powerUsage: devices.reduce((total, device) => total + device.powerDraw, 0),
    updatedAt: new Date().toISOString()
  };
};

export const toggleDeviceById = (id) => {
  if (typeof id !== "string") {
    return null;
  }

  const normalizedId = id.trim().toUpperCase();
  const device = officeState.find((item) => item.id === normalizedId);

  if (!device) {
    return null;
  }

  const isTurningOn = device.status === "OFF";
  device.status = isTurningOn ? "ON" : "OFF";
  device.powerDraw = isTurningOn ? RATED_POWER[device.type] : 0;
  device.lastChanged = new Date().toISOString();

  return cloneDevice(device);
};

const getRandomDeviceIndexes = () => {
  const count = Math.random() < 0.5 ? 1 : 2;
  const selectedIndexes = new Set();

  while (selectedIndexes.size < count) {
    selectedIndexes.add(Math.floor(Math.random() * officeState.length));
  }

  return Array.from(selectedIndexes);
};

const runSimulationTick = () => {
  lastSimulationTick = new Date().toISOString();
  console.log("[Simulation] Tick started");

  const selectedIndexes = getRandomDeviceIndexes();
  for (const index of selectedIndexes) {
    const updatedDevice = toggleDeviceById(officeState[index].id);
    console.log(
      `[Simulation] Toggled ${updatedDevice.id} -> ${updatedDevice.status}`
    );
  }

  runAlertDetection();
  const snapshot = getOfficeSnapshot();
  console.log(`[Simulation] Total power: ${snapshot.totalPowerUsage}W`);

  if (typeof simulationUpdateHandler === "function") {
    simulationUpdateHandler(snapshot);
  }
};

const buildExpectedAlerts = () => {
  const expectedAlerts = new Map();
  const now = new Date();
  const nowMs = now.getTime();
  const currentHour = now.getHours();
  const isOutsideOfficeHours =
    currentHour < OFFICE_START_HOUR || currentHour >= OFFICE_END_HOUR;

  for (const device of officeState) {
    if (device.status !== "ON") {
      continue;
    }

    if (isOutsideOfficeHours) {
      expectedAlerts.set(`AFTER_HOURS_DEVICE:${device.id}`, {
        type: "AFTER_HOURS_DEVICE",
        message: `${getDeviceLabel(device)} is still ON outside office hours.`
      });
    }

    const onDurationMs = nowMs - new Date(device.lastChanged).getTime();
    if (onDurationMs > FIVE_MINUTES_MS) {
      expectedAlerts.set(`DEVICE_ON_TOO_LONG_TEST:${device.id}`, {
        type: "DEVICE_ON_TOO_LONG_TEST",
        message: `${device.id} has been ON continuously for more than 5 minutes.`
      });
    }
  }

  for (const roomName of ROOM_NAMES) {
    const roomDevices = getRoomDevices(roomName);
    const allRoomDevicesOnTooLong =
      roomDevices.length === 5 &&
      roomDevices.every((device) => {
        if (device.status !== "ON") {
          return false;
        }

        const onDurationMs = nowMs - new Date(device.lastChanged).getTime();
        return onDurationMs > TWO_HOURS_MS;
      });

    if (allRoomDevicesOnTooLong) {
      expectedAlerts.set(`ROOM_ALL_ON_TOO_LONG:${roomName}`, {
        type: "ROOM_ALL_ON_TOO_LONG",
        message: `All 5 devices in ${roomName} have been ON continuously for more than 2 hours.`
      });
    }
  }

  return expectedAlerts;
};

export const runAlertDetection = () => {
  const expectedAlerts = buildExpectedAlerts();
  let changed = false;

  for (const [key, expectedAlert] of expectedAlerts) {
    if (!activeAlertsByKey.has(key)) {
      const alert = {
        id: randomUUID(),
        type: expectedAlert.type,
        message: expectedAlert.message,
        timestamp: new Date().toISOString()
      };

      activeAlertsByKey.set(key, alert);
      changed = true;
      console.log(`[Alerts] Created ${alert.type}: ${alert.message}`);
    }
  }

  for (const [key, alert] of activeAlertsByKey) {
    if (!expectedAlerts.has(key)) {
      activeAlertsByKey.delete(key);
      changed = true;
      console.log(`[Alerts] Resolved ${alert.type}: ${alert.message}`);
    }
  }

  return {
    changed,
    snapshot: getOfficeSnapshot()
  };
};

export const startSimulation = (onUpdate) => {
  if (typeof onUpdate === "function") {
    simulationUpdateHandler = onUpdate;
  }

  if (simulationInterval) {
    console.log("[Simulation] Simulation loop already running");
    return;
  }

  simulationInterval = setInterval(runSimulationTick, SIMULATION_INTERVAL_MS);

  console.log("[Simulation] Simulation loop started");
};

export const pauseSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log("[Simulation] Automatic simulation paused");
  }

  return getSimulationStatus();
};

export const resumeSimulation = (onUpdate) => {
  if (typeof onUpdate === "function") {
    simulationUpdateHandler = onUpdate;
  }

  if (!simulationInterval) {
    simulationInterval = setInterval(runSimulationTick, SIMULATION_INTERVAL_MS);
    console.log("[Simulation] Automatic simulation resumed");
  }

  return getSimulationStatus();
};

export const setSimulationRunning = (isRunning) => {
  if (isRunning) {
    return resumeSimulation();
  }

  return pauseSimulation();
};

export const startAlertEngine = (onUpdate) => {
  if (alertInterval) {
    console.log("[Alerts] Alert engine already running");
    return;
  }

  alertInterval = setInterval(() => {
    const result = runAlertDetection();

    if (result.changed && typeof onUpdate === "function") {
      onUpdate(result.snapshot);
    }
  }, 30 * 1000);

  console.log("[Alerts] Alert engine started");
};

export const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }

  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }

  console.log("[Simulation] Intervals stopped");
};
