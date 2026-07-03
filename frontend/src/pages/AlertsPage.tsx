import { ActiveAlertsPanel } from "../components/dashboard/ActiveAlertsPanel";
import { LoadingState } from "../components/feedback/LoadingState";
import { useOfficeDashboard } from "../hooks/useOfficeDashboard";
import { deriveAlertTarget } from "../utils/alertUtils";

export const AlertsPage = () => {
  const { snapshot, loading } = useOfficeDashboard();

  if (loading && !snapshot) {
    return <LoadingState />;
  }

  if (!snapshot) {
    return null;
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Alerts</h2>
          <p>Active backend alerts only. Resolved history is not available yet.</p>
        </div>
        <span className="badge">{snapshot.alerts.length} active</span>
      </div>
      <ActiveAlertsPanel alerts={snapshot.alerts} />
      {snapshot.alerts.length ? (
        <div className="page-grid" style={{ marginTop: 16 }}>
          {snapshot.alerts.map((alert) => (
            <article className="glass-card panel-card" key={alert.id}>
              <div className="row">
                <span>Related target</span>
                <strong>{deriveAlertTarget(alert)}</strong>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};
