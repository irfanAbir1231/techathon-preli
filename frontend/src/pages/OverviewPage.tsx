import { ActiveAlertsPanel } from "../components/dashboard/ActiveAlertsPanel";
import { DiscordPreview } from "../components/dashboard/DiscordPreview";
import { KpiGrid } from "../components/dashboard/KpiGrid";
import { LiveDeviceStatus } from "../components/dashboard/LiveDeviceStatus";
import { OfficeFloorOverview } from "../components/dashboard/OfficeFloorOverview";
import { PowerTrend } from "../components/dashboard/PowerTrend";
import { RoomSummary } from "../components/dashboard/RoomSummary";
import { SystemStatusCard } from "../components/dashboard/SystemStatusCard";
import { LoadingState } from "../components/feedback/LoadingState";
import { useOfficeDashboard } from "../hooks/useOfficeDashboard";

export const OverviewPage = () => {
  const {
    snapshot,
    loading,
    socketStatus,
    lastReceivedAt,
    trend,
    pendingDeviceIds,
    toggleDeviceById
  } = useOfficeDashboard();

  if (loading && !snapshot) {
    return <LoadingState />;
  }

  if (!snapshot) {
    return null;
  }

  return (
    <>
      <div className="dashboard-grid">
        <OfficeFloorOverview
          snapshot={snapshot}
          pendingDeviceIds={pendingDeviceIds}
          onToggle={toggleDeviceById}
        />
        <div className="right-stack">
          <KpiGrid snapshot={snapshot} />
          <PowerTrend trend={trend} />
        </div>
      </div>
      <div className="bottom-grid">
        <RoomSummary snapshot={snapshot} />
        <LiveDeviceStatus
          snapshot={snapshot}
          pendingDeviceIds={pendingDeviceIds}
          onToggle={toggleDeviceById}
        />
        <ActiveAlertsPanel alerts={snapshot.alerts} limit={3} />
        <div className="right-stack">
          <DiscordPreview />
          <SystemStatusCard
            hasSnapshot={Boolean(snapshot)}
            socketStatus={socketStatus}
            lastReceivedAt={lastReceivedAt}
          />
        </div>
      </div>
    </>
  );
};
