import type { OfficeSnapshot } from "../../types/office";
import { getRoomAlerts, getRoomDevices, ROOM_NAMES } from "../../utils/roomUtils";
import { GlassCard } from "../common/GlassCard";

export const RoomSummary = ({ snapshot }: { snapshot: OfficeSnapshot }) => {
  const totalOn = snapshot.officeState.filter((device) => device.status === "ON").length;

  return (
    <GlassCard className="panel-card">
      <div className="section-heading">
        <h2 className="section-title">Room Summary</h2>
        <span className="badge">Total</span>
      </div>
      <div className="room-summary-header">
        <span>Room</span>
        <span>Power</span>
        <span>ON / Total</span>
      </div>
      <div className="table-like">
        {ROOM_NAMES.map((room) => {
          const devices = getRoomDevices(snapshot.officeState, room);
          const onCount = devices.filter((device) => device.status === "ON").length;
          const hasAlert = getRoomAlerts(snapshot.alerts, room).length > 0;
          return (
            <div className="row" key={room}>
              <span className="mini-panel-row">
                <span className={`status-dot ${hasAlert ? "warning" : onCount ? "active" : ""}`} />
                {room}
              </span>
              <strong>{snapshot.roomPowerUsage[room]} W</strong>
              <span className="muted">
                {onCount} / {devices.length}
              </span>
            </div>
          );
        })}
        <div className="row">
          <strong>Total</strong>
          <strong>{snapshot.totalPowerUsage} W</strong>
          <span className="muted">
            {totalOn} / {snapshot.officeState.length}
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
