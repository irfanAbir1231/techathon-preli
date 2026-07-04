import { Activity, AlertTriangle, PlugZap, Zap } from "lucide-react";
import type { OfficeSnapshot } from "../../types/office";
import { countDevices } from "../../utils/deviceUtils";
import { ROOM_NAMES } from "../../utils/roomUtils";
import { GlassCard } from "../common/GlassCard";

export const KpiGrid = ({ snapshot }: { snapshot: OfficeSnapshot }) => {
  const counts = countDevices(snapshot.officeState);
  const activeRooms = ROOM_NAMES.filter((room) =>
    snapshot.officeState.some((device) => device.room === room && device.status === "ON")
  ).length;
  const onPercent = counts.total ? Math.round((counts.on / counts.total) * 100) : 0;
  const hasAlerts = snapshot.alerts.length > 0;

  const cards = [
    {
      label: "Total Power",
      value: `${snapshot.totalPowerUsage} W`,
      hint: "Live consumption",
      icon: Zap,
      accent: "var(--kpi-power)",
      accentBg: "var(--kpi-power-bg)",
      accentGlow: "var(--kpi-power-glow)"
    },
    {
      label: "Devices ON",
      value: `${counts.on} / ${counts.total}`,
      hint: `${onPercent}% of devices`,
      icon: PlugZap,
      accent: "var(--kpi-devices)",
      accentBg: "var(--kpi-devices-bg)",
      accentGlow: "var(--kpi-devices-glow)"
    },
    {
      label: "Rooms Active",
      value: `${activeRooms} / ${ROOM_NAMES.length}`,
      hint: "Rooms drawing power",
      icon: Activity,
      accent: "var(--kpi-rooms)",
      accentBg: "var(--kpi-rooms-bg)",
      accentGlow: "var(--kpi-rooms-glow)"
    },
    {
      label: "Active Alerts",
      value: `${snapshot.alerts.length}`,
      hint: hasAlerts ? "Requires attention" : "No active alerts",
      icon: AlertTriangle,
      accent: hasAlerts ? "var(--kpi-alerts)" : "var(--kpi-devices)",
      accentBg: hasAlerts ? "var(--kpi-alerts-bg)" : "var(--kpi-devices-bg)",
      accentGlow: hasAlerts ? "var(--kpi-alerts-glow)" : "var(--kpi-devices-glow)"
    }
  ];

  return (
    <section className="kpi-grid" aria-label="Office energy metrics">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <GlassCard
            className="kpi-card"
            key={card.label}
            style={{
              "--kpi-accent": card.accent,
              "--kpi-accent-bg": card.accentBg,
              "--kpi-accent-glow": card.accentGlow
            } as React.CSSProperties}
          >
            <div className="kpi-icon">
              <Icon size={20} />
            </div>
            <span className="kpi-label">{card.label}</span>
            <p className="kpi-value">{card.value}</p>
            <span className="kpi-hint">{card.hint}</span>
          </GlassCard>
        );
      })}
    </section>
  );
};
