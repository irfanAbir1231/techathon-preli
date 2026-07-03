import type { Device } from "../types/office";

export const getDeviceNumber = (device: Device) => {
  const raw = device.id.split("_")[1] ?? "";
  return raw.replace(/^[A-Z]+/, "");
};

export const getDeviceLabel = (device: Device) =>
  `${device.type === "fan" ? "Fan" : "Light"} ${getDeviceNumber(device)}`;

export const getDeviceDisplayName = (device: Device) =>
  `${device.room} ${getDeviceLabel(device)}`;

export const countDevices = (devices: Device[]) => ({
  total: devices.length,
  on: devices.filter((device) => device.status === "ON").length,
  fans: devices.filter((device) => device.type === "fan").length,
  fansOn: devices.filter(
    (device) => device.type === "fan" && device.status === "ON"
  ).length,
  lights: devices.filter((device) => device.type === "light").length,
  lightsOn: devices.filter(
    (device) => device.type === "light" && device.status === "ON"
  ).length
});
