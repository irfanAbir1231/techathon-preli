import { useMemo, useState } from "react";
import { DeviceControl } from "../components/dashboard/DeviceControl";
import { LoadingState } from "../components/feedback/LoadingState";
import { useOfficeDashboard } from "../hooks/useOfficeDashboard";
import type { DeviceStatus, DeviceType, RoomName } from "../types/office";
import { formatRelativeTime } from "../utils/dateUtils";
import { getDeviceDisplayName } from "../utils/deviceUtils";
import { ROOM_NAMES } from "../utils/roomUtils";

type AllOption<T extends string> = "all" | T;

export const DevicesPage = () => {
  const { snapshot, loading, pendingDeviceIds, toggleDeviceById } =
    useOfficeDashboard();
  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState<AllOption<RoomName>>("all");
  const [typeFilter, setTypeFilter] = useState<AllOption<DeviceType>>("all");
  const [statusFilter, setStatusFilter] = useState<AllOption<DeviceStatus>>("all");

  const devices = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    return snapshot.officeState.filter((device) => {
      const matchesQuery =
        !normalizedQuery ||
        device.id.toLowerCase().includes(normalizedQuery) ||
        device.room.toLowerCase().includes(normalizedQuery);
      const matchesRoom = roomFilter === "all" || device.room === roomFilter;
      const matchesType = typeFilter === "all" || device.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || device.status === statusFilter;

      return matchesQuery && matchesRoom && matchesType && matchesStatus;
    });
  }, [query, roomFilter, snapshot, statusFilter, typeFilter]);

  if (loading && !snapshot) {
    return <LoadingState />;
  }

  if (!snapshot) {
    return null;
  }

  return (
    <section className="glass-card device-page-card">
      <div className="page-header">
        <div>
          <h2>Devices</h2>
          <p>Search, filter, and toggle the 15 backend-managed devices.</p>
        </div>
        <span className="badge">{devices.length} shown</span>
      </div>
      <div className="device-toolbar">
        <input
          aria-label="Search devices"
          className="field"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by ID or room"
          value={query}
        />
        <select
          aria-label="Filter by room"
          className="field"
          onChange={(event) => setRoomFilter(event.target.value as AllOption<RoomName>)}
          value={roomFilter}
        >
          <option value="all">All rooms</option>
          {ROOM_NAMES.map((room) => (
            <option key={room} value={room}>
              {room}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by type"
          className="field"
          onChange={(event) => setTypeFilter(event.target.value as AllOption<DeviceType>)}
          value={typeFilter}
        >
          <option value="all">All types</option>
          <option value="fan">Fans</option>
          <option value="light">Lights</option>
        </select>
        <select
          aria-label="Filter by status"
          className="field"
          onChange={(event) =>
            setStatusFilter(event.target.value as AllOption<DeviceStatus>)
          }
          value={statusFilter}
        >
          <option value="all">All statuses</option>
          <option value="ON">ON</option>
          <option value="OFF">OFF</option>
        </select>
      </div>
      <table className="device-table">
        <thead>
          <tr>
            <th>Device</th>
            <th>Device ID</th>
            <th>Room</th>
            <th>Type</th>
            <th>Status</th>
            <th>Power draw</th>
            <th>Last changed</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id}>
              <td data-label="Device">{getDeviceDisplayName(device)}</td>
              <td data-label="Device ID">{device.id}</td>
              <td data-label="Room">{device.room}</td>
              <td data-label="Type">{device.type}</td>
              <td data-label="Status">{device.status}</td>
              <td data-label="Power draw">{device.powerDraw} W</td>
              <td data-label="Last changed">
                Changed {formatRelativeTime(device.lastChanged)}
              </td>
              <td data-label="Action">
                <DeviceControl
                  compact
                  device={device}
                  onToggle={toggleDeviceById}
                  pending={pendingDeviceIds.has(device.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
