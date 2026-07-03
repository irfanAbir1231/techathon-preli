import { Fan, Lightbulb } from "lucide-react";
import type { Device } from "../../types/office";
import { formatRelativeTime } from "../../utils/dateUtils";
import { getDeviceLabel } from "../../utils/deviceUtils";

export const DeviceControl = ({
  device,
  pending,
  onToggle,
  compact = false
}: {
  device: Device;
  pending: boolean;
  onToggle: (id: string) => void;
  compact?: boolean;
}) => {
  const Icon = device.type === "fan" ? Fan : Lightbulb;
  const isOn = device.status === "ON";

  return (
    <button
      aria-label={`Toggle ${getDeviceLabel(device)} in ${device.room}. Current status ${device.status}`}
      className={`device-control ${isOn ? "is-on" : "is-off"} is-${device.type} ${pending ? "is-pending" : ""}`}
      disabled={pending}
      onClick={() => onToggle(device.id)}
      style={compact ? { width: 32, height: 32, borderRadius: 11 } : undefined}
      type="button"
    >
      <Icon size={compact ? 17 : 22} aria-hidden="true" />
      <span className="device-tooltip" role="tooltip">
        <strong>{getDeviceLabel(device)}</strong>
        <br />
        {device.room}
        <br />
        {device.status} · {device.powerDraw} W
        <br />
        Changed {formatRelativeTime(device.lastChanged)}
      </span>
    </button>
  );
};
