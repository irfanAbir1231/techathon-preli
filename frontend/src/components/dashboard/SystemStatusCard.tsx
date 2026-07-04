import { ServerCog } from "lucide-react";
import type { SimulationStatus, SocketStatus } from "../../types/office";
import { formatRelativeTime } from "../../utils/dateUtils";
import { GlassCard } from "../common/GlassCard";

export const SystemStatusCard = ({
  hasSnapshot,
  pendingSimulationChange,
  simulation,
  socketStatus,
  lastReceivedAt,
  onToggleSimulation
}: {
  hasSnapshot: boolean;
  pendingSimulationChange: boolean;
  simulation?: SimulationStatus;
  socketStatus: SocketStatus;
  lastReceivedAt: Date | null;
  onToggleSimulation: () => Promise<void>;
}) => {
  const receivingLiveUpdates = socketStatus === "live";
  const hasSimulationStatus = Boolean(simulation);
  const simulationLabel = simulation
    ? simulation.isRunning
      ? "Running"
      : "Paused"
    : "Unknown";
  const simulationButtonLabel = pendingSimulationChange
    ? "Updating..."
    : simulation?.isRunning
      ? "Pause Simulation"
      : "Resume Simulation";

  return (
    <GlassCard className="panel-card">
      <div className="section-heading">
        <h2 className="section-title">
          <ServerCog size={18} /> Backend Status
        </h2>
      </div>
      <div className="table-like">
        <div className="row">
          <span>Backend</span>
          <strong className={hasSnapshot ? "text-live" : "text-danger"}>
            {hasSnapshot ? "Connected" : "Unavailable"}
          </strong>
        </div>
        <div className="row">
          <span>Live updates</span>
          <strong className={receivingLiveUpdates ? "text-live" : "text-warning"}>
            {receivingLiveUpdates ? "Active" : socketStatus}
          </strong>
        </div>
        <div className="row">
          <span>Last event</span>
          <strong>{formatRelativeTime(lastReceivedAt)}</strong>
        </div>
        <div className="simulation-control">
          <div className="simulation-status-row">
            <span>Live simulator</span>
            <strong>
              <span
                className={`status-dot ${simulation?.isRunning ? "active" : "warning"}`}
              />
              <span className={simulation?.isRunning ? "text-live" : "text-warning"}>
                {simulationLabel}
              </span>
            </strong>
          </div>
          <div className="simulation-meta">
            <span>
              Interval:{" "}
              {simulation ? `${simulation.intervalMs / 1000} seconds` : "unknown"}
            </span>
            <span>Last tick: {formatRelativeTime(simulation?.lastTick)}</span>
          </div>
          <button
            className="text-button simulation-toggle"
            disabled={!hasSimulationStatus || pendingSimulationChange}
            onClick={() => {
              void onToggleSimulation();
            }}
            type="button"
          >
            {hasSimulationStatus ? simulationButtonLabel : "Simulation unavailable"}
          </button>
        </div>
      </div>
    </GlassCard>
  );
};
