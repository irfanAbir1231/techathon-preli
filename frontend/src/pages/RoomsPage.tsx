import { ActiveAlertsPanel } from "../components/dashboard/ActiveAlertsPanel";
import { DeviceControl } from "../components/dashboard/DeviceControl";
import { LoadingState } from "../components/feedback/LoadingState";
import { useOfficeDashboard } from "../hooks/useOfficeDashboard";
import { getRoomDevices, getRoomAlerts, ROOM_NAMES } from "../utils/roomUtils";

export const RoomsPage = () => {
  const { snapshot, loading, pendingDeviceIds, toggleDeviceById } =
    useOfficeDashboard();

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
          <h2>Rooms</h2>
          <p>Exactly three office rooms, each with 2 fans and 3 lights.</p>
        </div>
      </div>
      <div className="room-card-grid">
        {ROOM_NAMES.map((room) => {
          const devices = getRoomDevices(snapshot.officeState, room);
          const alerts = getRoomAlerts(snapshot.alerts, room);
          const onCount = devices.filter((device) => device.status === "ON").length;
          return (
            <article className="glass-card room-card" key={room}>
              <div className="section-heading">
                <h3 className="section-title">{room}</h3>
                <span className="badge">{snapshot.roomPowerUsage[room]} W</span>
              </div>
              <p className="muted">
                {onCount} / {devices.length} devices ON
              </p>
              <div className="device-icon-strip" aria-label={`${room} devices`}>
                {devices.map((device) => (
                  <DeviceControl
                    device={device}
                    key={device.id}
                    onToggle={toggleDeviceById}
                    pending={pendingDeviceIds.has(device.id)}
                  />
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <ActiveAlertsPanel alerts={alerts} limit={3} compact />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
