import { vi } from "vitest";
import type { OfficeSnapshot } from "../types/office";
import { sampleSnapshot } from "./sampleData";

export const toggleMock = vi.fn();

export const makeDashboardValue = (snapshot: OfficeSnapshot = sampleSnapshot) => ({
  snapshot,
  loading: false,
  error: null,
  envError: null,
  socketStatus: "live" as const,
  lastReceivedAt: new Date("2026-07-03T10:24:00.000Z"),
  trend: [
    { time: "2026-07-03T10:23:00.000Z", label: "10:23 AM", watts: 180 },
    { time: "2026-07-03T10:24:00.000Z", label: "10:24 AM", watts: 225 }
  ],
  pendingDeviceIds: new Set<string>(),
  toast: null,
  retry: vi.fn(),
  toggleDeviceById: toggleMock,
  dismissToast: vi.fn()
});
