import { describe, expect, it, vi } from "vitest";
import { fetchOfficeStatus, toggleDevice } from "./officeApi";
import { sampleSnapshot } from "../test/sampleData";

describe("officeApi", () => {
  it("sends toggle requests with the correct ID", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://backend.example");
    vi.stubEnv("VITE_SOCKET_URL", "https://backend.example");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          message: "Device toggled successfully",
          device: sampleSnapshot.officeState[0],
          snapshot: sampleSnapshot
        })
    });
    vi.stubGlobal("fetch", fetchMock);

    await toggleDevice("DR_F1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example/api/device/toggle",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: "DR_F1" })
      })
    );
  });

  it("shows an understandable error for failed API responses", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://backend.example");
    vi.stubEnv("VITE_SOCKET_URL", "https://backend.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Device not found" })
      })
    );

    await expect(fetchOfficeStatus()).rejects.toThrow("Device not found");
  });
});
