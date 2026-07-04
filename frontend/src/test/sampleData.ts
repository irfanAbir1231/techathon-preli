import type { OfficeSnapshot } from "../types/office";

const now = new Date("2026-07-03T10:24:00.000Z").toISOString();

export const sampleSnapshot: OfficeSnapshot = {
  officeState: [
    { id: "DR_F1", room: "Drawing Room", type: "fan", status: "ON", powerDraw: 60, lastChanged: now },
    { id: "DR_F2", room: "Drawing Room", type: "fan", status: "OFF", powerDraw: 0, lastChanged: now },
    { id: "DR_L1", room: "Drawing Room", type: "light", status: "ON", powerDraw: 15, lastChanged: now },
    { id: "DR_L2", room: "Drawing Room", type: "light", status: "OFF", powerDraw: 0, lastChanged: now },
    { id: "DR_L3", room: "Drawing Room", type: "light", status: "OFF", powerDraw: 0, lastChanged: now },
    { id: "WR1_F1", room: "Work Room 1", type: "fan", status: "ON", powerDraw: 60, lastChanged: now },
    { id: "WR1_F2", room: "Work Room 1", type: "fan", status: "ON", powerDraw: 60, lastChanged: now },
    { id: "WR1_L1", room: "Work Room 1", type: "light", status: "ON", powerDraw: 15, lastChanged: now },
    { id: "WR1_L2", room: "Work Room 1", type: "light", status: "OFF", powerDraw: 0, lastChanged: now },
    { id: "WR1_L3", room: "Work Room 1", type: "light", status: "OFF", powerDraw: 0, lastChanged: now },
    { id: "WR2_F1", room: "Work Room 2", type: "fan", status: "OFF", powerDraw: 0, lastChanged: now },
    { id: "WR2_F2", room: "Work Room 2", type: "fan", status: "OFF", powerDraw: 0, lastChanged: now },
    { id: "WR2_L1", room: "Work Room 2", type: "light", status: "ON", powerDraw: 15, lastChanged: now },
    { id: "WR2_L2", room: "Work Room 2", type: "light", status: "OFF", powerDraw: 0, lastChanged: now },
    { id: "WR2_L3", room: "Work Room 2", type: "light", status: "OFF", powerDraw: 0, lastChanged: now }
  ],
  totalPowerUsage: 225,
  roomPowerUsage: {
    "Drawing Room": 75,
    "Work Room 1": 135,
    "Work Room 2": 15
  },
  alerts: [
    {
      id: "alert-1",
      type: "AFTER_HOURS_DEVICE",
      message: "Drawing Room Light 1 is still ON outside office hours.",
      timestamp: now
    }
  ],
  simulation: {
    isRunning: true,
    intervalMs: 15000,
    lastTick: now
  },
  updatedAt: now
};

export const emptyAlertSnapshot: OfficeSnapshot = {
  ...sampleSnapshot,
  alerts: []
};
