import type { Alert, RoomName } from "../types/office";
import { ROOM_NAMES } from "./roomUtils";

export const getAlertTone = (type: string) => {
  if (type.includes("AFTER_HOURS") || type.includes("TOO_LONG")) {
    return "warning";
  }
  return "info";
};

export const deriveAlertTarget = (alert: Alert): RoomName | string => {
  const room = ROOM_NAMES.find((name) =>
    alert.message.toLowerCase().includes(name.toLowerCase())
  );

  if (room) {
    return room;
  }

  const deviceMatch = alert.message.match(/\b(?:DR|WR1|WR2)_[FL]\d\b/);
  return deviceMatch?.[0] ?? "Office";
};
