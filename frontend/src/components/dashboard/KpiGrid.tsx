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

  const cards = [
    {
      label: "Total Power",
      value: `${snapshot.totalPowerUsage} W`,
      hint: "Live consumption",
      icon: Zap
    },
    {
      label: "Devices ON",
      value: `${counts.on} / ${counts.total}`,
      hint: `${onPercent}% of devices`,
      icon: PlugZap
    },
    {
      label: "Rooms Active",
      value: `${activeRooms} / ${ROOM_NAMES.length}`,
      hint: "Rooms drawing power",
      icon: Activity
    },
    {
      label: "Active Alerts",
      value: `${snapshot.alerts.length}`,
      hint: snapshot.alerts.length ? "Requires attention" : "No active alerts",
      icon: AlertTriangle
    }
  ];

  return (
    <section className="kpi-grid" aria-label="Office energy metrics">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <GlassCard className="kpi-card" key={card.label}>
            <div className="kpi-icon">
              <Icon size={20} />
            </div>
            <span>{card.label}</span>
            <p className="kpi-value">{card.value}</p>
            <span>{card.hint}</span>
          </GlassCard>
        );
      })}
    </section>
  );
};
