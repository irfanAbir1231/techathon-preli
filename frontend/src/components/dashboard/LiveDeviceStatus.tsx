import type { OfficeSnapshot } from "../../types/office";
import { countDevices } from "../../utils/deviceUtils";
import { getRoomDevices, ROOM_NAMES } from "../../utils/roomUtils";
import { GlassCard } from "../common/GlassCard";
import { DeviceControl } from "./DeviceControl";

export const LiveDeviceStatus = ({
  snapshot,
  pendingDeviceIds,
  onToggle
}: {
  snapshot: OfficeSnapshot;
  pendingDeviceIds: Set<string>;
  onToggle: (id: string) => void;
}) => {
  const counts = countDevices(snapshot.officeState);

  return (
    <GlassCard className="panel-card">
      <div className="section-heading">
        <h2 className="section-title">Live Device Status</h2>
        <span className="badge">Total</span>
      </div>
      <div className="row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <span>Fans<br /><span className="muted">{counts.fans} total · {counts.fansOn} ON</span></span>
        <span>Lights<br /><span className="muted">{counts.lights} total · {counts.lightsOn} ON</span></span>
        <span>Devices<br /><span className="muted">{counts.total} total · {counts.on} ON</span></span>
      </div>
      <div className="device-rows" style={{ marginTop: 12 }}>
        {ROOM_NAMES.map((room) => {
          const devices = getRoomDevices(snapshot.officeState, room);
          const onCount = devices.filter((device) => device.status === "ON").length;
          return (
            <div className="row" key={room}>
              <span>{room}</span>
              <span className="device-icon-strip">
                {devices.map((device) => (
                  <DeviceControl
                    compact
                    device={device}
                    key={device.id}
                    onToggle={onToggle}
                    pending={pendingDeviceIds.has(device.id)}
                  />
                ))}
              </span>
              <span className="muted">{onCount} / 5</span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
