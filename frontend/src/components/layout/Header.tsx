import { Bell, Clock, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { useOfficeDashboard } from "../../hooks/useOfficeDashboard";
import { formatClock } from "../../utils/dateUtils";
import { GlassCard } from "../common/GlassCard";
import { StatusBadge } from "../common/StatusBadge";

export const Header = () => {
  const { socketStatus } = useOfficeDashboard();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <GlassCard className="app-header">
      <div className="header-copy">
        <h1>Office Energy Dashboard</h1>
        <p>Real-time device monitoring and power insights.</p>
      </div>
      <div className="header-pills">
        <StatusBadge status={socketStatus} />
        <span className="pill">
          <span className="status-dot live" />
          Office Hours
        </span>
        <span className="pill">
          <Clock size={16} />
          9:00 AM - 5:00 PM
        </span>
        <span className="pill">{formatClock(now)}</span>
        <span className="pill" aria-label="Notifications">
          <Bell size={17} />
        </span>
        <span className="pill">
          <Radio size={17} />
          Console
        </span>
      </div>
    </GlassCard>
  );
};
