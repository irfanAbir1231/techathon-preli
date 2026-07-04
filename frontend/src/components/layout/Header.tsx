import { Bell, Clock, Radio, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { useOfficeDashboard } from "../../hooks/useOfficeDashboard";
import { formatClock } from "../../utils/dateUtils";
import { GlassCard } from "../common/GlassCard";
import { StatusBadge } from "../common/StatusBadge";

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header = ({ isSidebarOpen, onToggleSidebar }: HeaderProps) => {
  const { socketStatus } = useOfficeDashboard();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <GlassCard className="app-header">
      <div className="header-copy" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {!isSidebarOpen && onToggleSidebar && (
          <button 
            className="sidebar-toggle" 
            onClick={onToggleSidebar} 
            aria-label="Open Sidebar"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <PanelLeftOpen size={24} />
          </button>
        )}
        <div>
          <h1>Office Energy Dashboard</h1>
          <p>Real-time device monitoring and power insights.</p>
        </div>
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
