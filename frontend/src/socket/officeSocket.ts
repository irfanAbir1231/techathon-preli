import { io, type Socket } from "socket.io-client";
import type { OfficeSnapshot } from "../types/office";

export type OfficeSocket = Socket<{
  "dashboard-update": (snapshot: OfficeSnapshot) => void;
}>;

export const createOfficeSocket = (socketUrl: string): OfficeSocket =>
  io(socketUrl, {
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  });
