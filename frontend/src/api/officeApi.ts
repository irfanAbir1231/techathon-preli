import type { OfficeSnapshot } from "../types/office";

interface ApiErrorBody {
  error?: string;
}

const readEnvValue = (key: "VITE_API_BASE_URL" | "VITE_SOCKET_URL") => {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : "";
};

export const getFrontendConfig = () => {
  const apiBaseUrl = readEnvValue("VITE_API_BASE_URL");
  const socketUrl = readEnvValue("VITE_SOCKET_URL");
  const missing = [
    !apiBaseUrl ? "VITE_API_BASE_URL" : null,
    !socketUrl ? "VITE_SOCKET_URL" : null
  ].filter(Boolean) as string[];

  return {
    apiBaseUrl,
    socketUrl,
    isValid: missing.length === 0,
    missing
  };
};

const requestJson = async <T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal
): Promise<T> => {
  const { apiBaseUrl, isValid, missing } = getFrontendConfig();

  if (!isValid) {
    throw new Error(`Missing frontend environment variables: ${missing.join(", ")}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    signal,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });

  const body = (await response.json().catch(() => null)) as ApiErrorBody | T | null;

  if (!response.ok) {
    const hasErrorMessage =
      body !== null &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string";
    const message =
      hasErrorMessage
        ? body.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!body) {
    throw new Error("Backend returned an empty response.");
  }

  return body as T;
};

export const fetchOfficeStatus = (signal?: AbortSignal) =>
  requestJson<OfficeSnapshot>("/api/status", {}, signal);

export const toggleDevice = (id: string, signal?: AbortSignal) =>
  requestJson<{ message: string; device: unknown; snapshot: OfficeSnapshot }>(
    "/api/device/toggle",
    {
      method: "POST",
      body: JSON.stringify({ id })
    },
    signal
  );
