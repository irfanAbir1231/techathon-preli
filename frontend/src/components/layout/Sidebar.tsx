import {
  Bell,
  BarChart3,
  Building2,
  FileText,
  Home,
  MonitorCog,
  Settings,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useOfficeDashboard } from "../../hooks/useOfficeDashboard";
import { GlassCard } from "../common/GlassCard";

const navItems = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/rooms", label: "Rooms", icon: Building2 },
  { to: "/devices", label: "Devices", icon: MonitorCog },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings }
];

export const Sidebar = () => {
  const { snapshot } = useOfficeDashboard();
  const alertCount = snapshot?.alerts.length ?? 0;

  return (
    <GlassCard className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <ShieldCheck />
        </div>
        <div>
          <strong>Office Energy</strong>
          <br />
          <span>Dashboard</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              end={item.to === "/"}
              key={item.to}
              to={item.to}
            >
              <span className="nav-link-inner">
                <Icon size={20} />
                {item.label}
              </span>
              {item.label === "Alerts" && alertCount > 0 ? (
                <span className="count-badge">{alertCount}</span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="mini-panel">
          <div className="mini-panel-row">
            <span className="status-dot live" />
            <strong>Office Hours</strong>
            <SlidersHorizontal size={16} style={{ marginLeft: "auto" }} />
          </div>
          <p className="muted">9:00 AM - 5:00 PM</p>
        </div>
        <div className="mini-panel">
          <div className="mini-panel-row">
            <span className="avatar">OE</span>
            <div>
              <strong>Operations Console</strong>
              <br />
              <span className="muted">Frontend only</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
