import { Bell, Building2, Home, MonitorCog } from "lucide-react";
import { NavLink } from "react-router-dom";
import { GlassCard } from "../common/GlassCard";

const items = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/rooms", label: "Rooms", icon: Building2 },
  { to: "/devices", label: "Devices", icon: MonitorCog },
  { to: "/alerts", label: "Alerts", icon: Bell }
];

export const MobileNavigation = () => (
  <GlassCard className="mobile-nav" aria-label="Mobile navigation">
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          aria-label={item.label}
          className={({ isActive }) => (isActive ? "active" : "")}
          end={item.to === "/"}
          key={item.to}
          to={item.to}
        >
          <Icon size={20} />
        </NavLink>
      );
    })}
  </GlassCard>
);
