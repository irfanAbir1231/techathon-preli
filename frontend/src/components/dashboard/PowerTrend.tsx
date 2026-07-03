import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { TrendPoint } from "../../types/office";
import { GlassCard } from "../common/GlassCard";

export const PowerTrend = ({ trend }: { trend: TrendPoint[] }) => (
  <GlassCard className="chart-card">
    <div className="section-heading">
      <h2 className="section-title">Live Session Power Trend</h2>
      <span className="badge">Current session</span>
    </div>
    {trend.length < 2 ? (
      <div className="chart-empty">
        <p className="muted">Waiting for live updates...</p>
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={trend} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="powerFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#5b8cff" stopOpacity={0.38} />
              <stop offset="95%" stopColor="#5b8cff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="label" stroke="#718096" tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis stroke="#718096" tickLine={false} axisLine={false} unit=" W" />
          <Tooltip
            contentStyle={{
              background: "rgba(10, 20, 34, 0.96)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              color: "#f4f7fb"
            }}
            formatter={(value) => [`${value} W`, "Power"]}
            labelFormatter={(label) => `${label}`}
          />
          <Area
            type="monotone"
            dataKey="watts"
            stroke="#5b8cff"
            strokeWidth={2}
            fill="url(#powerFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </GlassCard>
);
