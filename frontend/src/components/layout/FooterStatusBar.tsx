import { ShieldCheck } from "lucide-react";
import { useOfficeDashboard } from "../../hooks/useOfficeDashboard";
import { formatClock, formatRelativeTime } from "../../utils/dateUtils";
import { GlassCard } from "../common/GlassCard";

export const FooterStatusBar = () => {
  const { lastReceivedAt, socketStatus, snapshot } = useOfficeDashboard();
  const status =
    socketStatus === "live" ? "Live updates active" : "Data may be stale";

  return (
    <GlassCard className="footer-bar">
      <span className="muted">
        Last updated:{" "}
        {lastReceivedAt ? `${formatClock(lastReceivedAt)} · ${formatRelativeTime(lastReceivedAt)}` : "No update yet"}
      </span>
      <span className="mini-panel-row">
        <ShieldCheck color="var(--green-live)" size={19} />
        <span>{snapshot?.alerts.length ? "Alerts require attention" : "All systems operational"}</span>
      </span>
      <span className="muted">{status}</span>
    </GlassCard>
  );
};
