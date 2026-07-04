import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "../components/common/GlassCard";
import { useOfficeDashboard } from "../hooks/useOfficeDashboard";
import { getCostPerKwh, setCostPerKwh, DEFAULT_COST_PER_KWH } from "../utils/costConfig";
import { getFrontendConfig } from "../api/officeApi";
import {
  AlertTriangle,
  Bot,
  Check,
  Clock,
  DollarSign,
  Globe,
  Info,
  RotateCcw,
  Server,
  Settings,
  Wifi,
  Zap
} from "lucide-react";

/* ── types ───────────────────────────────────────────── */

interface ConfigItem {
  icon: typeof Clock;
  label: string;
  value: string;
  detail?: string;
  accent?: string;
}

/* ── sub-components ──────────────────────────────────── */

const ConfigSection = ({
  title,
  badge,
  items
}: {
  title: string;
  badge?: string;
  items: ConfigItem[];
}) => (
  <GlassCard className="panel-card">
    <div className="section-heading">
      <h2 className="section-title">{title}</h2>
      {badge ? <span className="badge">{badge}</span> : null}
    </div>
    <div className="settings-config-list">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div className="settings-config-item" key={item.label}>
            <div
              className="settings-config-icon"
              style={{ color: item.accent ?? "var(--blue-primary)" }}
            >
              <Icon size={18} />
            </div>
            <div className="settings-config-body">
              <span className="settings-config-label">{item.label}</span>
              <strong className="settings-config-value">{item.value}</strong>
              {item.detail ? (
                <span className="settings-config-detail muted">{item.detail}</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  </GlassCard>
);

const CostEditor = () => {
  const [value, setValue] = useState(() => getCostPerKwh());
  const [saved, setSaved] = useState(false);
  const [inputText, setInputText] = useState(() => String(getCostPerKwh()));

  const handleSave = useCallback(() => {
    const parsed = Number(inputText);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setCostPerKwh(parsed);
      setValue(parsed);
      setSaved(true);
    }
  }, [inputText]);

  const handleReset = useCallback(() => {
    setCostPerKwh(DEFAULT_COST_PER_KWH);
    setValue(DEFAULT_COST_PER_KWH);
    setInputText(String(DEFAULT_COST_PER_KWH));
    setSaved(true);
  }, []);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  const isValid = !Number.isNaN(Number(inputText)) && Number(inputText) > 0;
  const hasChanged = Number(inputText) !== value;

  return (
    <GlassCard className="panel-card">
      <div className="section-heading">
        <h2 className="section-title">Electricity Cost</h2>
        <span className="badge">Editable</span>
      </div>
      <p className="muted" style={{ marginBottom: 14, fontSize: "0.86rem" }}>
        This value is used by Analytics and Reports pages to calculate cost estimates.
        It is stored in your browser's local storage.
      </p>
      <div className="settings-cost-editor">
        <div className="settings-cost-input-wrap">
          <span className="settings-cost-currency">৳</span>
          <input
            id="cost-per-kwh-input"
            type="number"
            step="0.01"
            min="0.01"
            className="field settings-cost-input"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setSaved(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValid && hasChanged) handleSave();
            }}
          />
          <span className="settings-cost-unit">/kWh</span>
        </div>
        <div className="settings-cost-actions">
          <button
            className="text-button"
            disabled={!isValid || !hasChanged}
            onClick={handleSave}
          >
            {saved ? <Check size={14} /> : <DollarSign size={14} />}
            {saved ? "Saved" : "Save"}
          </button>
          <button
            className="text-button settings-reset-btn"
            onClick={handleReset}
            title={`Reset to ৳${DEFAULT_COST_PER_KWH}`}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>
      {saved ? (
        <div className="settings-saved-toast">
          <Check size={14} />
          Cost updated to ৳{value}/kWh — Analytics and Reports will use this rate.
        </div>
      ) : null}
    </GlassCard>
  );
};

export const SettingsPage = () => {
  return (
    <>
      <GlassCard className="coming-soon-card" style={{ padding: "22px" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h2>Settings</h2>
            <p>System configuration and preferences</p>
          </div>
          <span className="badge">
            <Settings size={13} />
            Configuration
          </span>
        </div>
      </GlassCard>

      <div className="settings-grid">
        <CostEditor />
      </div>
    </>
  );
};
