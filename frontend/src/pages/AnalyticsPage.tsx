import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { OfficeSnapshot, TrendPoint } from "../types/office";
import { countDevices } from "../utils/deviceUtils";
import { ROOM_NAMES } from "../utils/roomUtils";
import { GlassCard } from "../components/common/GlassCard";
import { LoadingState } from "../components/feedback/LoadingState";
import { useOfficeDashboard } from "../hooks/useOfficeDashboard";
import { getCostPerKwh } from "../utils/costConfig";
import {
  Activity,
  BarChart3,
  DollarSign,
  TrendingUp,
  Zap
} from "lucide-react";

/* ── constants ───────────────────────────────────────── */



const ROOM_COLORS: Record<string, string> = {
  "Drawing Room": "#5b8cff",
  "Work Room 1": "#63e6a5",
  "Work Room 2": "#38bdf8"
};

const DEVICE_TYPE_COLORS = {
  fan: "#5b8cff",
  light: "#ffc85c"
};

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "rgba(7, 17, 31, 0.97)",
  border: "1px solid rgba(91,140,255,0.2)",
  borderRadius: 14,
  color: "#f4f7fb",
  boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
  padding: "10px 14px"
};

/* ── derived metrics ─────────────────────────────────── */

interface SessionMetrics {
  peak: number;
  average: number;
  min: number;
  costBdt: number;
  uptimeRatio: number;
  sessionMinutes: number;
}

const deriveSessionMetrics = (trend: TrendPoint[], costPerKwh: number): SessionMetrics => {
  if (trend.length === 0) {
    return { peak: 0, average: 0, min: 0, costBdt: 0, uptimeRatio: 0, sessionMinutes: 0 };
  }

  const wattValues = trend.map((p) => p.watts);
  const peak = Math.max(...wattValues);
  const min = Math.min(...wattValues);
  const average = Math.round(wattValues.reduce((a, b) => a + b, 0) / wattValues.length);

  // Each trend point represents ~15 seconds (simulation interval).
  // Estimate session duration for cost calculation.
  const sessionMinutes = (trend.length * 15) / 60;
  const sessionHours = sessionMinutes / 60;
  const avgKw = average / 1000;
  const costBdt = avgKw * sessionHours * costPerKwh;

  const uptimeRatio =
    wattValues.filter((w) => w > 0).length / wattValues.length;

  return { peak, average, min, costBdt, uptimeRatio, sessionMinutes };
};

/* ── sub-components ──────────────────────────────────── */

interface KpiCardData {
  label: string;
  value: string;
  hint: string;
  icon: typeof Zap;
  accent: string;
  accentBg: string;
  accentGlow: string;
}

const AnalyticsKpi = ({ cards }: { cards: KpiCardData[] }) => (
  <section className="kpi-grid" aria-label="Analytics metrics">
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

const SessionPowerChart = ({
  trend,
  metrics
}: {
  trend: TrendPoint[];
  metrics: SessionMetrics;
}) => (
  <GlassCard className="chart-card analytics-chart-wide">
    <div className="section-heading">
      <h2 className="section-title">
        Session Power Trend
        <span
          className="status-dot live"
          style={{ marginLeft: 4 }}
          aria-label="Live data"
          title="Receiving live data"
        />
      </h2>
      <span className="badge">
        {trend.length} data points · {metrics.sessionMinutes.toFixed(1)} min
      </span>
    </div>
    {trend.length < 2 ? (
      <div className="chart-empty">
        <p className="muted">Accumulating data points…</p>
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={trend} margin={{ top: 10, right: 12, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id="analyticsPowerFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#5b8cff" stopOpacity={0.42} />
              <stop offset="95%" stopColor="#5b8cff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#7e8aa1"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            stroke="#7e8aa1"
            tick={{ fontSize: 11 }}
            tickCount={5}
            tickLine={false}
            axisLine={false}
            width={48}
            allowDecimals={false}
            tickFormatter={(v) => `${v}W`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [`${value} W`, "Power"]}
            labelFormatter={(label) => `${label}`}
          />
          <ReferenceLine
            y={metrics.peak}
            stroke="#ff6b6b"
            strokeDasharray="6 4"
            label={{ value: `Peak ${metrics.peak}W`, fill: "#ff6b6b", fontSize: 11, position: "insideTopRight" }}
          />
          <ReferenceLine
            y={metrics.average}
            stroke="#63e6a5"
            strokeDasharray="6 4"
            label={{ value: `Avg ${metrics.average}W`, fill: "#63e6a5", fontSize: 11, position: "insideBottomRight" }}
          />
          <Area
            type="monotone"
            dataKey="watts"
            stroke="#5b8cff"
            strokeWidth={2.5}
            fill="url(#analyticsPowerFill)"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </GlassCard>
);

const RoomPowerChart = ({ snapshot }: { snapshot: OfficeSnapshot }) => {
  const data = ROOM_NAMES.map((room) => ({
    room,
    power: snapshot.roomPowerUsage[room]
  }));

  return (
    <GlassCard className="chart-card analytics-chart-half">
      <div className="section-heading">
        <h2 className="section-title">Room Power Distribution</h2>
        <span className="badge">Live</span>
      </div>
      {data.every((d) => d.power === 0) ? (
        <div className="chart-empty">
          <p className="muted">All rooms idle</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 2, left: 2 }} barSize={36}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="room"
              stroke="#7e8aa1"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#7e8aa1"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={42}
              allowDecimals={false}
              tickFormatter={(v) => `${v}W`}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${value} W`, "Power"]}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar dataKey="power" radius={[6, 6, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.room} fill={ROOM_COLORS[d.room] ?? "#5b8cff"} fillOpacity={0.82} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  );
};

const DeviceTypeChart = ({ snapshot }: { snapshot: OfficeSnapshot }) => {
  const counts = countDevices(snapshot.officeState);
  const fanPower = snapshot.officeState
    .filter((d) => d.type === "fan")
    .reduce((sum, d) => sum + d.powerDraw, 0);
  const lightPower = snapshot.officeState
    .filter((d) => d.type === "light")
    .reduce((sum, d) => sum + d.powerDraw, 0);

  const data = [
    { name: "Fans", value: fanPower, count: counts.fansOn, total: counts.fans, color: DEVICE_TYPE_COLORS.fan },
    { name: "Lights", value: lightPower, count: counts.lightsOn, total: counts.lights, color: DEVICE_TYPE_COLORS.light }
  ];

  const totalPower = fanPower + lightPower;

  return (
    <GlassCard className="chart-card analytics-chart-half">
      <div className="section-heading">
        <h2 className="section-title">Device Type Breakdown</h2>
        <span className="badge">{totalPower} W total</span>
      </div>
      {totalPower === 0 ? (
        <div className="chart-empty">
          <p className="muted">All devices off</p>
        </div>
      ) : (
        <div className="analytics-donut-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                animationDuration={600}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} fillOpacity={0.88} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number, name: string) => [`${value} W`, name]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => <span style={{ color: "#a9b4c7", fontSize: "0.82rem" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="analytics-donut-stats">
            {data.map((d) => (
              <div key={d.name} className="analytics-donut-stat">
                <span className="analytics-donut-dot" style={{ background: d.color }} />
                <span>{d.name}</span>
                <strong>{d.value} W</strong>
                <span className="muted">{d.count}/{d.total} on</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

const DevicePowerTable = ({ snapshot }: { snapshot: OfficeSnapshot }) => {
  const sorted = [...snapshot.officeState].sort((a, b) => b.powerDraw - a.powerDraw);

  return (
    <GlassCard className="panel-card analytics-table-card">
      <div className="section-heading">
        <h2 className="section-title">Per-Device Power</h2>
        <span className="badge">{snapshot.officeState.length} devices</span>
      </div>
      <div className="analytics-table-scroll">
        <table className="device-table">
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Room</th>
              <th>Type</th>
              <th>Status</th>
              <th>Power</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((device) => (
              <tr key={device.id}>
                <td data-label="Device">{device.id}</td>
                <td data-label="Room">{device.room}</td>
                <td data-label="Type">
                  <span className={`type-badge type-${device.type}`}>
                    {device.type}
                  </span>
                </td>
                <td data-label="Status">
                  <span className={`device-status-badge status-${device.status.toLowerCase()}`}>
                    {device.status}
                  </span>
                </td>
                <td data-label="Power">
                  <strong>{device.powerDraw} W</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

/* ── main page ───────────────────────────────────────── */

export const AnalyticsPage = () => {
  const { snapshot, loading, trend } = useOfficeDashboard();

  const costPerKwh = getCostPerKwh();
  const metrics = useMemo(() => deriveSessionMetrics(trend, costPerKwh), [trend, costPerKwh]);

  if (loading && !snapshot) {
    return <LoadingState />;
  }

  if (!snapshot) {
    return null;
  }

  const kpiCards: KpiCardData[] = [
    {
      label: "Peak Power",
      value: `${metrics.peak} W`,
      hint: "Highest in session",
      icon: TrendingUp,
      accent: "var(--kpi-alerts)",
      accentBg: "var(--kpi-alerts-bg)",
      accentGlow: "var(--kpi-alerts-glow)"
    },
    {
      label: "Avg Power",
      value: `${metrics.average} W`,
      hint: "Session average",
      icon: BarChart3,
      accent: "var(--kpi-power)",
      accentBg: "var(--kpi-power-bg)",
      accentGlow: "var(--kpi-power-glow)"
    },
    {
      label: "Est. Cost",
      value: `৳${metrics.costBdt < 0.01 ? "0.00" : metrics.costBdt.toFixed(2)}`,
      hint: `@ ৳${costPerKwh}/kWh`,
      icon: DollarSign,
      accent: "var(--kpi-devices)",
      accentBg: "var(--kpi-devices-bg)",
      accentGlow: "var(--kpi-devices-glow)"
    },
    {
      label: "Uptime Ratio",
      value: `${Math.round(metrics.uptimeRatio * 100)}%`,
      hint: "Active vs idle time",
      icon: Activity,
      accent: "var(--kpi-rooms)",
      accentBg: "var(--kpi-rooms-bg)",
      accentGlow: "var(--kpi-rooms-glow)"
    }
  ];

  return (
    <>
      <GlassCard className="coming-soon-card" style={{ padding: "22px" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h2>Analytics</h2>
            <p>Real-time energy insights derived from the live simulation</p>
          </div>
          <span className="badge">
            <span className="status-dot live" style={{ width: 7, height: 7 }} />
            Live data
          </span>
        </div>
      </GlassCard>

      <AnalyticsKpi cards={kpiCards} />

      <SessionPowerChart trend={trend} metrics={metrics} />

      <div className="analytics-charts-row">
        <RoomPowerChart snapshot={snapshot} />
        <DeviceTypeChart snapshot={snapshot} />
      </div>

      <DevicePowerTable snapshot={snapshot} />
    </>
  );
};
