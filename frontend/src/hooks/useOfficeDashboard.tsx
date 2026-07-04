import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  fetchOfficeStatus,
  getFrontendConfig,
  toggleDevice,
  toggleSimulation
} from "../api/officeApi";
import { createOfficeSocket } from "../socket/officeSocket";
import type { OfficeSnapshot, SocketStatus, TrendPoint } from "../types/office";
import { formatClock } from "../utils/dateUtils";

interface ToastMessage {
  id: string;
  message: string;
}

interface DashboardContextValue {
  snapshot: OfficeSnapshot | null;
  loading: boolean;
  error: string | null;
  envError: string | null;
  socketStatus: SocketStatus;
  lastReceivedAt: Date | null;
  trend: TrendPoint[];
  pendingDeviceIds: Set<string>;
  pendingSimulationChange: boolean;
  toast: ToastMessage | null;
  retry: () => void;
  toggleDeviceById: (id: string) => Promise<void>;
  toggleSimulationRunning: () => Promise<void>;
  dismissToast: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

const validateSnapshot = (snapshot: OfficeSnapshot) => {
  if (!Array.isArray(snapshot.officeState)) {
    throw new Error("Malformed backend response: officeState is missing.");
  }
  if (!snapshot.roomPowerUsage || typeof snapshot.totalPowerUsage !== "number") {
    throw new Error("Malformed backend response: power usage is missing.");
  }
  if (!Array.isArray(snapshot.alerts)) {
    throw new Error("Malformed backend response: alerts are missing.");
  }
};

const makeTrendPoint = (snapshot: OfficeSnapshot): TrendPoint => {
  const date = new Date(snapshot.updatedAt);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

  return {
    time: safeDate.toISOString(),
    label: formatClock(safeDate),
    watts: snapshot.totalPowerUsage
  };
};

export const OfficeDashboardProvider = ({ children }: { children: ReactNode }) => {
  const config = useMemo(() => getFrontendConfig(), []);
  const [snapshot, setSnapshot] = useState<OfficeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("connecting");
  const [lastReceivedAt, setLastReceivedAt] = useState<Date | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [pendingDeviceIds, setPendingDeviceIds] = useState<Set<string>>(new Set());
  const [pendingSimulationChange, setPendingSimulationChange] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const envError = config.isValid
    ? null
    : `Missing frontend environment variables: ${config.missing.join(", ")}`;

  const acceptSnapshot = useCallback((nextSnapshot: OfficeSnapshot) => {
    validateSnapshot(nextSnapshot);
    setSnapshot(nextSnapshot);
    setLastReceivedAt(new Date());
    setError(null);
    setTrend((previous) => [...previous, makeTrendPoint(nextSnapshot)].slice(-60));
  }, []);

  const loadSnapshot = useCallback(
    async (signal?: AbortSignal) => {
      if (!config.isValid) {
        setLoading(false);
        return;
      }

      try {
        const nextSnapshot = await fetchOfficeStatus(signal);
        acceptSnapshot(nextSnapshot);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    },
    [acceptSnapshot, config.isValid]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadSnapshot(controller.signal);
    return () => controller.abort();
  }, [loadSnapshot, reloadKey]);

  useEffect(() => {
    if (!config.isValid) {
      setSocketStatus("offline");
      return undefined;
    }

    setSocketStatus("connecting");
    const socket = createOfficeSocket(config.socketUrl);

    socket.on("connect", () => {
      if (import.meta.env.DEV) {
        console.info("[Socket] Connected");
      }
      setSocketStatus("live");
    });

    socket.io.on("reconnect_attempt", () => {
      if (import.meta.env.DEV) {
        console.info("[Socket] Reconnection attempt");
      }
      setSocketStatus("reconnecting");
    });

    socket.on("disconnect", () => {
      if (import.meta.env.DEV) {
        console.info("[Socket] Disconnected");
      }
      setSocketStatus("offline");
    });

    socket.on("dashboard-update", (nextSnapshot) => {
      if (import.meta.env.DEV) {
        console.info("[Socket] Dashboard update received");
      }

      try {
        acceptSnapshot(nextSnapshot);
      } catch (socketError) {
        setError(
          socketError instanceof Error
            ? socketError.message
            : "Received malformed live update."
        );
      }
    });

    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
    };
  }, [acceptSnapshot, config.isValid, config.socketUrl]);

  useEffect(() => {
    if (socketStatus === "live" || !config.isValid) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void loadSnapshot();
    }, 45000);

    return () => window.clearInterval(intervalId);
  }, [config.isValid, loadSnapshot, socketStatus]);

  const toggleDeviceById = useCallback(
    async (id: string) => {
      setPendingDeviceIds((previous) => new Set(previous).add(id));

      try {
        const response = await toggleDevice(id);
        acceptSnapshot(response.snapshot);
      } catch (toggleError) {
        setToast({
          id: `${id}-${Date.now()}`,
          message:
            toggleError instanceof Error
              ? toggleError.message
              : "Unable to toggle this device."
        });
      } finally {
        setPendingDeviceIds((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      }
    },
    [acceptSnapshot]
  );

  const toggleSimulationRunning = useCallback(async () => {
    setPendingSimulationChange(true);

    try {
      const response = await toggleSimulation();
      acceptSnapshot(response.snapshot);
    } catch (simulationError) {
      setToast({
        id: `simulation-${Date.now()}`,
        message:
          simulationError instanceof Error
            ? simulationError.message
            : "Unable to update simulation status."
      });
    } finally {
      setPendingSimulationChange(false);
    }
  }, [acceptSnapshot]);

  const value = useMemo(
    () => ({
      snapshot,
      loading,
      error,
      envError,
      socketStatus,
      lastReceivedAt,
      trend,
      pendingDeviceIds,
      pendingSimulationChange,
      toast,
      retry: () => {
        setLoading(true);
        setReloadKey((key) => key + 1);
      },
      toggleDeviceById,
      toggleSimulationRunning,
      dismissToast: () => setToast(null)
    }),
    [
      snapshot,
      loading,
      error,
      envError,
      socketStatus,
      lastReceivedAt,
      trend,
      pendingDeviceIds,
      pendingSimulationChange,
      toast,
      toggleDeviceById,
      toggleSimulationRunning
    ]
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
};

export const useOfficeDashboard = () => {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useOfficeDashboard must be used within OfficeDashboardProvider.");
  }

  return context;
};
