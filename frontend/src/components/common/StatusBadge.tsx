import type { SocketStatus } from "../../types/office";

const statusLabel: Record<SocketStatus, string> = {
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting",
  offline: "Offline"
};

export const StatusBadge = ({ status }: { status: SocketStatus }) => (
  <span className="pill" aria-label={`Socket status: ${statusLabel[status]}`}>
    <span
      className={`status-dot ${status === "live" ? "live" : status === "offline" ? "alert" : "warning"}`}
    />
    {statusLabel[status]}
  </span>
);
