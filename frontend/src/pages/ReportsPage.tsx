import { useMemo } from "react";
import type { OfficeSnapshot, TrendPoint } from "../types/office";
import { countDevices, getDeviceDisplayName } from "../utils/deviceUtils";
import { ROOM_NAMES } from "../utils/roomUtils";
import { getCostPerKwh } from "../utils/costConfig";
import { formatRelativeTime } from "../utils/dateUtils";
import { GlassCard } from "../components/common/GlassCard";
import { LoadingState } from "../components/feedback/LoadingState";
import { useOfficeDashboard } from "../hooks/useOfficeDashboard";
import {
  ClipboardList,
  Download,
  FileJson,
  FileSpreadsheet,
  Zap
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────── */

interface SessionSummary {
  dataPoints: number;
  sessionMinutes: number;
  peakW: number;
  avgW: number;
  minW: number;
  totalEnergyWh: number;
  estimatedCostBdt: number;
  costPerKwh: number;
}

const deriveSessionSummary = (trend: TrendPoint[]): SessionSummary => {
  const costPerKwh = getCostPerKwh();

  if (trend.length === 0) {
    return {
      dataPoints: 0,
      sessionMinutes: 0,
      peakW: 0,
      avgW: 0,
      minW: 0,
      totalEnergyWh: 0,
      estimatedCostBdt: 0,
      costPerKwh
    };
  }

  const watts = trend.map((p) => p.watts);
  const peakW = Math.max(...watts);
  const minW = Math.min(...watts);
  const avgW = Math.round(watts.reduce((a, b) => a + b, 0) / watts.length);

  const sessionMinutes = (trend.length * 15) / 60;
  const sessionHours = sessionMinutes / 60;
  const totalEnergyWh = Math.round(avgW * sessionHours);
  const estimatedCostBdt = (totalEnergyWh / 1000) * costPerKwh;

  return {
    dataPoints: trend.length,
    sessionMinutes,
    peakW,
    avgW,
    minW,
    totalEnergyWh,
    estimatedCostBdt,
    costPerKwh
  };
};

const downloadFile = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const exportTrendCsv = (trend: TrendPoint[]) => {
  const header = "Timestamp,Label,Power (W)\n";
  const rows = trend.map((p) => `${p.time},${p.label},${p.watts}`).join("\n");
  downloadFile(
    `energy-trend-${new Date().toISOString().slice(0, 10)}.csv`,
    header + rows,
    "text/csv"
  );
};

const exportSnapshotJson = (snapshot: OfficeSnapshot) => {
  downloadFile(
    `device-snapshot-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(snapshot, null, 2),
    "application/json"
  );
};

/* ── sub-components ──────────────────────────────────── */

const SessionSummaryCard = ({ summary }: { summary: SessionSummary }) => {
  const rows = [
    { label: "Session Duration", value: `${summary.sessionMinutes.toFixed(1)} min` },
    { label: "Data Points", value: `${summary.dataPoints}` },
    { label: "Peak Power", value: `${summary.peakW} W` },
    { label: "Average Power", value: `${summary.avgW} W` },
    { label: "Minimum Power", value: `${summary.minW} W` },
    { label: "Energy Consumed", value: `${summary.totalEnergyWh} Wh` },
    {
      label: `Est. Cost (@ ৳${summary.costPerKwh}/kWh)`,
      value: `৳${summary.estimatedCostBdt < 0.01 ? "0.00" : summary.estimatedCostBdt.toFixed(2)}`
    }
  ];

  return (
    <GlassCard className="panel-card">
      <div className="section-heading">
        <h2 className="section-title">Session Summary</h2>
        <span className="badge">
          <span className="status-dot live" style={{ width: 7, height: 7 }} />
          Live
        </span>
      </div>
      <div className="report-stat-grid">
        {rows.map((row) => (
          <div key={row.label} className="report-stat-row">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const RoomBreakdownCard = ({ snapshot }: { snapshot: OfficeSnapshot }) => {
  const totalPower = snapshot.totalPowerUsage;
  const costPerKwh = getCostPerKwh();

  return (
    <GlassCard className="panel-card">
      <div className="section-heading">
        <h2 className="section-title">Room Breakdown</h2>
        <span className="badge">{totalPower} W total</span>
      </div>
      <div className="report-table-scroll">
        <table className="device-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Power</th>
              <th>% of Total</th>
              <th>Devices ON</th>
              <th>Est. Cost/hr</th>
            </tr>
          </thead>
          <tbody>
            {ROOM_NAMES.map((room) => {
              const power = snapshot.roomPowerUsage[room];
              const pct = totalPower > 0 ? Math.round((power / totalPower) * 100) : 0;
              const devices = snapshot.officeState.filter((d) => d.room === room);
              const onCount = devices.filter((d) => d.status === "ON").length;
              const costPerHour = (power / 1000) * costPerKwh;
              return (
                <tr key={room}>
                  <td data-label="Room">{room}</td>
                  <td data-label="Power"><strong>{power} W</strong></td>
                  <td data-label="% of Total">
                    <div className="report-bar-wrap">
                      <div className="report-bar" style={{ width: `${pct}%` }} />
                      <span>{pct}%</span>
                    </div>
                  </td>
                  <td data-label="Devices ON">{onCount} / {devices.length}</td>
                  <td data-label="Cost/hr">৳{costPerHour.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

const DeviceUtilizationCard = ({ snapshot }: { snapshot: OfficeSnapshot }) => {
  const sorted = [...snapshot.officeState].sort((a, b) => b.powerDraw - a.powerDraw);

  return (
    <GlassCard className="panel-card report-device-card">
      <div className="section-heading">
        <h2 className="section-title">Device Utilization</h2>
        <span className="badge">{snapshot.officeState.length} devices</span>
      </div>
      <div className="report-table-scroll">
        <table className="device-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Room</th>
              <th>Type</th>
              <th>Status</th>
              <th>Power</th>
              <th>Last Changed</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((device) => (
              <tr key={device.id}>
                <td data-label="Device">{device.id}</td>
                <td data-label="Room">{device.room}</td>
                <td data-label="Type">
                  <span className={`type-badge type-${device.type}`}>{device.type}</span>
                </td>
                <td data-label="Status">
                  <span className={`device-status-badge status-${device.status.toLowerCase()}`}>
                    {device.status}
                  </span>
                </td>
                <td data-label="Power"><strong>{device.powerDraw} W</strong></td>
                <td data-label="Last Changed">{formatRelativeTime(device.lastChanged)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

const CostBreakdownCard = ({ snapshot }: { snapshot: OfficeSnapshot }) => {
  const costPerKwh = getCostPerKwh();
  const counts = countDevices(snapshot.officeState);
  const fanPower = snapshot.officeState
    .filter((d) => d.type === "fan")
    .reduce((s, d) => s + d.powerDraw, 0);
  const lightPower = snapshot.officeState
    .filter((d) => d.type === "light")
    .reduce((s, d) => s + d.powerDraw, 0);

  const totalCostPerHour = (snapshot.totalPowerUsage / 1000) * costPerKwh;
  const fanCostPerHour = (fanPower / 1000) * costPerKwh;
  const lightCostPerHour = (lightPower / 1000) * costPerKwh;

  const rows = [
    { label: "Fans", detail: `${counts.fansOn} on · ${fanPower} W`, cost: fanCostPerHour },
    { label: "Lights", detail: `${counts.lightsOn} on · ${lightPower} W`, cost: lightCostPerHour },
    { label: "Total", detail: `${counts.on} on · ${snapshot.totalPowerUsage} W`, cost: totalCostPerHour }
  ];

  return (
    <GlassCard className="panel-card">
      <div className="section-heading">
        <h2 className="section-title">Cost Breakdown</h2>
        <span className="badge">@ ৳{costPerKwh}/kWh</span>
      </div>
      <div className="table-like">
        {rows.map((row) => (
          <div
            className={`row ${row.label === "Total" ? "report-total-row" : ""}`}
            key={row.label}
          >
            <strong>{row.label}</strong>
            <span className="muted">{row.detail}</span>
            <strong>৳{row.cost.toFixed(2)}/hr</strong>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 12, fontSize: "0.78rem" }}>
        Cost estimates are based on instantaneous power draw projected over 1 hour.
        Actual usage will vary as devices toggle.
      </p>
    </GlassCard>
  );
};

const ExportActionsCard = ({
  trend,
  snapshot
}: {
  trend: TrendPoint[];
  snapshot: OfficeSnapshot;
}) => (
  <GlassCard className="panel-card">
    <div className="section-heading">
      <h2 className="section-title">Export Data</h2>
      <span className="badge">
        <Download size={12} /> Download
      </span>
    </div>
    <div className="report-export-grid">
      <button
        className="report-export-btn"
        onClick={() => exportTrendCsv(trend)}
        disabled={trend.length === 0}
      >
        <div className="report-export-icon csv">
          <FileSpreadsheet size={22} />
        </div>
        <div>
          <strong>Session Trend (CSV)</strong>
          <span className="muted">
            {trend.length} data points · Power over time
          </span>
        </div>
      </button>
      <button
        className="report-export-btn"
        onClick={() => exportSnapshotJson(snapshot)}
      >
        <div className="report-export-icon json">
          <FileJson size={22} />
        </div>
        <div>
          <strong>Device Snapshot (JSON)</strong>
          <span className="muted">
            {snapshot.officeState.length} devices · Full state dump
          </span>
        </div>
      </button>
    </div>
  </GlassCard>
);

/* ── main page ───────────────────────────────────────── */

export const ReportsPage = () => {
  const { snapshot, loading, trend } = useOfficeDashboard();

  const summary = useMemo(() => deriveSessionSummary(trend), [trend]);

  if (loading && !snapshot) {
    return <LoadingState />;
  }

  if (!snapshot) {
    return null;
  }

  return (
    <>
      <GlassCard className="coming-soon-card" style={{ padding: "22px" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h2>Reports</h2>
            <p>Session energy reports with exportable data</p>
          </div>
          <span className="badge">
            <ClipboardList size={13} />
            {summary.dataPoints} samples
          </span>
        </div>
      </GlassCard>

      <div className="report-top-grid">
        <SessionSummaryCard summary={summary} />
        <CostBreakdownCard snapshot={snapshot} />
        <ExportActionsCard trend={trend} snapshot={snapshot} />
      </div>

      <RoomBreakdownCard snapshot={snapshot} />
      <DeviceUtilizationCard snapshot={snapshot} />
    </>
  );
};
