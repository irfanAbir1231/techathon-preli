export type RoomName = "Drawing Room" | "Work Room 1" | "Work Room 2";
export type DeviceType = "fan" | "light";
export type DeviceStatus = "ON" | "OFF";

export interface Device {
  id: string;
  room: RoomName;
  type: DeviceType;
  status: DeviceStatus;
  powerDraw: number;
  lastChanged: string;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export type RoomPowerUsage = Record<RoomName, number>;

export interface OfficeSnapshot {
  officeState: Device[];
  totalPowerUsage: number;
  roomPowerUsage: RoomPowerUsage;
  alerts: Alert[];
  updatedAt: string;
}

export interface RoomStatus {
  room: RoomName;
  devices: Device[];
  activeDeviceCount: number;
  totalDeviceCount: number;
  powerUsage: number;
  updatedAt: string;
}

export type SocketStatus = "connecting" | "live" | "reconnecting" | "offline";

export interface TrendPoint {
  time: string;
  label: string;
  watts: number;
}
