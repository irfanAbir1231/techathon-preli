import type { Alert, Device, RoomName } from "../types/office";

export const ROOM_NAMES: RoomName[] = ["Drawing Room", "Work Room 1", "Work Room 2"];

export const ROOM_ALIASES: Record<RoomName, string> = {
  "Drawing Room": "drawing",
  "Work Room 1": "work1",
  "Work Room 2": "work2"
};

export const getRoomDevices = (devices: Device[], room: RoomName) =>
  devices.filter((device) => device.room === room);

export const getRoomOnCount = (devices: Device[], room: RoomName) =>
  getRoomDevices(devices, room).filter((device) => device.status === "ON").length;

export const getRoomAlerts = (alerts: Alert[], room: RoomName) =>
  alerts.filter((alert) => alert.message.toLowerCase().includes(room.toLowerCase()));
