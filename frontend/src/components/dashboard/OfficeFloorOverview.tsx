import type { CSSProperties } from "react";
import type { Device, OfficeSnapshot, RoomName } from "../../types/office";
import { getDeviceNumber } from "../../utils/deviceUtils";
import { getRoomDevices, ROOM_NAMES } from "../../utils/roomUtils";
import { GlassCard } from "../common/GlassCard";
import { DeviceControl } from "./DeviceControl";

const DEVICE_POSITIONS: Record<string, CSSProperties> = {
  DR_F1: { left: "30%", top: "26%" },
  DR_F2: { left: "30%", top: "68%" },
  DR_L1: { left: "29%", top: "43%" },
  DR_L2: { left: "50%", top: "43%" },
  DR_L3: { left: "71%", top: "43%" },
  WR1_F1: { left: "30%", top: "26%" },
  WR1_F2: { left: "67%", top: "26%" },
  WR1_L1: { left: "29%", top: "43%" },
  WR1_L2: { left: "67%", top: "43%" },
  WR1_L3: { left: "30%", top: "68%" },
  WR2_F1: { left: "78%", top: "26%" },
  WR2_F2: { left: "78%", top: "68%" },
  WR2_L1: { left: "50%", top: "43%" },
  WR2_L2: { left: "50%", top: "58%" },
  WR2_L3: { left: "28%", top: "43%" }
};

const TOOLTIP_PLACEMENTS: Record<string, "left" | "right" | "top"> = {
  DR_F1: "right",
  DR_F2: "right",
  DR_L3: "left",
  WR2_F1: "left",
  WR2_F2: "left",
  WR2_L3: "right"
};

const roomFurniture = (room: RoomName) => {
  if (room === "Drawing Room") {
    return (
      <>
        <span className="furniture sofa" />
        <span className="furniture table" />
      </>
    );
  }

  return (
    <>
      <span className="furniture desk-a" />
      <span className="furniture desk-b" />
    </>
  );
};

export const OfficeFloorOverview = ({
  snapshot,
  pendingDeviceIds,
  onToggle
}: {
  snapshot: OfficeSnapshot;
  pendingDeviceIds: Set<string>;
  onToggle: (id: string) => void;
}) => (
  <GlassCard className="office-floor">
    <div className="section-heading">
      <h2 className="section-title">Office Floor Overview</h2>
      <span className="badge">3 rooms · 15 devices</span>
    </div>
    <div className="floor-plan" aria-label="Interactive office floor plan">
      {ROOM_NAMES.map((room, roomIndex) => {
        const roomDevices = getRoomDevices(snapshot.officeState, room);
        return (
          <section
            className="floor-room"
            data-room-index={roomIndex}
            key={room}
            aria-label={room}
          >
            {roomFurniture(room)}
            <div className="room-label">
              <strong>{room}</strong>
              <span>{snapshot.roomPowerUsage[room]} W</span>
            </div>
            <div className="floor-devices">
              {roomDevices.map((device: Device) => (
                <span
                  className="device-pos"
                  key={device.id}
                  style={DEVICE_POSITIONS[device.id]}
                  data-tooltip={TOOLTIP_PLACEMENTS[device.id] ?? "top"}
                  data-device-number={getDeviceNumber(device)}
                >
                  <DeviceControl
                    device={device}
                    onToggle={onToggle}
                    pending={pendingDeviceIds.has(device.id)}
                  />
                </span>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  </GlassCard>
);
