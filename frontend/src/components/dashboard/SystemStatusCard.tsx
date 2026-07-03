import { ServerCog } from "lucide-react";
import type { SocketStatus } from "../../types/office";
import { formatRelativeTime } from "../../utils/dateUtils";
import { GlassCard } from "../common/GlassCard";

export const SystemStatusCard = ({
  hasSnapshot,
  socketStatus,
  lastReceivedAt
}: {
  hasSnapshot: boolean;
  socketStatus: SocketStatus;
  lastReceivedAt: Date | null;
}) => {
  const receivingLiveUpdates = socketStatus === "live";

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
          <strong>{hasSnapshot ? "Connected" : "Unavailable"}</strong>
        </div>
        <div className="row">
          <span>Live updates</span>
          <strong>{receivingLiveUpdates ? "Active" : socketStatus}</strong>
        </div>
        <div className="row">
          <span>Last event</span>
          <strong>{formatRelativeTime(lastReceivedAt)}</strong>
        </div>
        <div className="row">
          <span>Simulation</span>
          <strong>
            {receivingLiveUpdates
              ? "Receiving automatic updates"
              : "Simulation status unavailable"}
          </strong>
        </div>
      </div>
    </GlassCard>
  );
};
