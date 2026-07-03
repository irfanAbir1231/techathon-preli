import { AlertTriangle } from "lucide-react";
import type { Alert } from "../../types/office";
import { getAlertTone } from "../../utils/alertUtils";
import { formatDateTime } from "../../utils/dateUtils";
import { GlassCard } from "../common/GlassCard";
import { EmptyState } from "../feedback/EmptyState";

export const ActiveAlertsPanel = ({
  alerts,
  limit
}: {
  alerts: Alert[];
  limit?: number;
}) => {
  const visibleAlerts = typeof limit === "number" ? alerts.slice(0, limit) : alerts;

  return (
    <GlassCard className="panel-card">
      <div className="section-heading">
        <h2 className="section-title">Active Alerts</h2>
        {limit && alerts.length > limit ? <span className="badge">+{alerts.length - limit} more</span> : null}
      </div>
      {visibleAlerts.length === 0 ? (
        <EmptyState title="No active alerts" message="The office is operating normally." />
      ) : (
        <div className="alert-list">
          {visibleAlerts.map((alert) => (
            <article className="alert-item" key={alert.id}>
              <span className="alert-icon">
                <AlertTriangle size={18} />
              </span>
              <div>
                <strong>{alert.message}</strong>
                <p className="muted">
                  {alert.type} · {getAlertTone(alert.type)} · {formatDateTime(alert.timestamp)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
