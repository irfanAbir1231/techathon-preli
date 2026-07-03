import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DevicesPage } from "./DevicesPage";
import { makeDashboardValue } from "../test/mockDashboard";

vi.mock("../hooks/useOfficeDashboard", () => ({
  useOfficeDashboard: () => makeDashboardValue()
}));

describe("DevicesPage", () => {
  it("filters devices by room and type", async () => {
    const user = userEvent.setup();
    render(<DevicesPage />);

    await user.selectOptions(screen.getByLabelText("Filter by room"), "Work Room 1");
    await user.selectOptions(screen.getByLabelText("Filter by type"), "fan");

    expect(screen.getByText("WR1_F1")).toBeInTheDocument();
    expect(screen.getByText("WR1_F2")).toBeInTheDocument();
    expect(screen.queryByText("WR1_L1")).not.toBeInTheDocument();
    expect(screen.queryByText("DR_F1")).not.toBeInTheDocument();
  });
});
