import { ActiveAlertsPanel } from "../components/dashboard/ActiveAlertsPanel";
import { LoadingState } from "../components/feedback/LoadingState";
import { useOfficeDashboard } from "../hooks/useOfficeDashboard";

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
      <ActiveAlertsPanel alerts={snapshot.alerts} showTarget />
    </section>
  );
};
