import type { OfficeSnapshot } from "../../types/office";
import { countDevices } from "../../utils/deviceUtils";
import { getRoomDevices, ROOM_NAMES } from "../../utils/roomUtils";
import { GlassCard } from "../common/GlassCard";

export const LiveDeviceStatus = ({
  snapshot
}: {
  snapshot: OfficeSnapshot;
}) => {
  const counts = countDevices(snapshot.officeState);

  return (
    <GlassCard className="panel-card">
      <div className="section-heading">
        <h2 className="section-title">Live Device Status</h2>
        <span className="badge">Total</span>
      </div>
      <div className="live-stat-grid">
        <div className="live-stat-pill">
          <span>Fans</span>
          <strong>{counts.fansOn} / {counts.fans} ON</strong>
        </div>
        <div className="live-stat-pill">
          <span>Lights</span>
          <strong>{counts.lightsOn} / {counts.lights} ON</strong>
        </div>
        <div className="live-stat-pill">
          <span>Devices</span>
          <strong>{counts.on} / {counts.total} ON</strong>
        </div>
      </div>
      <div className="device-rows" style={{ marginTop: 12 }}>
        {ROOM_NAMES.map((room) => {
          const devices = getRoomDevices(snapshot.officeState, room);
          const onCount = devices.filter((device) => device.status === "ON").length;
          const fanOnCount = devices.filter(
            (device) => device.type === "fan" && device.status === "ON"
          ).length;
          const lightOnCount = devices.filter(
            (device) => device.type === "light" && device.status === "ON"
          ).length;
          return (
            <div className="row" key={room}>
              <span>{room}</span>
              <span className="muted">
                Fans {fanOnCount} / 2 · Lights {lightOnCount} / 3
              </span>
              <span className="muted">{onCount} / 5</span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
