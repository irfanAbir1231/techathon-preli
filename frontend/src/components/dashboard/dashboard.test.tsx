import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StatusBadge } from "../common/StatusBadge";
import { ActiveAlertsPanel } from "./ActiveAlertsPanel";
import { DeviceControl } from "./DeviceControl";
import { KpiGrid } from "./KpiGrid";
import { OfficeFloorOverview } from "./OfficeFloorOverview";
import { emptyAlertSnapshot, sampleSnapshot } from "../../test/sampleData";

describe("dashboard components", () => {
  it("renders exactly 15 devices from a valid snapshot", () => {
    render(
      <OfficeFloorOverview
        snapshot={sampleSnapshot}
        pendingDeviceIds={new Set()}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getAllByRole("button", { name: /toggle/i })).toHaveLength(15);
  });

  it("renders exactly 3 rooms", () => {
    render(
      <OfficeFloorOverview
        snapshot={sampleSnapshot}
        pendingDeviceIds={new Set()}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByRole("region", { name: "Drawing Room" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Work Room 1" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Work Room 2" })).toBeInTheDocument();
  });

  it("reflects ON/OFF device styling", () => {
    const onDevice = sampleSnapshot.officeState[0];
    const offDevice = sampleSnapshot.officeState[1];
    const { rerender } = render(
      <DeviceControl device={onDevice} pending={false} onToggle={vi.fn()} />
    );

    expect(screen.getByRole("button")).toHaveClass("is-on");

    rerender(<DeviceControl device={offDevice} pending={false} onToggle={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveClass("is-off");
  });

  it("displays total-power KPI from backend data", () => {
    render(<KpiGrid snapshot={sampleSnapshot} />);
    expect(screen.getByText("225 W")).toBeInTheDocument();
  });

  it("device toggle calls the correct handler with the correct ID", async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();
    render(
      <DeviceControl
        device={sampleSnapshot.officeState[0]}
        pending={false}
        onToggle={toggle}
      />
    );

    await user.click(screen.getByRole("button"));
    expect(toggle).toHaveBeenCalledWith("DR_F1");
  });

  it("shows the empty alert state when alerts are empty", () => {
    render(<ActiveAlertsPanel alerts={emptyAlertSnapshot.alerts} />);
    expect(screen.getByText("No active alerts")).toBeInTheDocument();
  });

  it("renders active backend alerts", () => {
    render(<ActiveAlertsPanel alerts={sampleSnapshot.alerts} />);
    expect(
      screen.getByText("Drawing Room Light 1 is still ON outside office hours.")
    ).toBeInTheDocument();
  });

  it("shows disconnected socket state", () => {
    render(<StatusBadge status="offline" />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
});
