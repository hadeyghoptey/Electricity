import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoomCard } from "./RoomCard";

describe("RoomCard", () => {
  const defaultProps = {
    number: 5,
    name: "John Doe",
    meterType: "separate",
    previous: 100,
    current: 150,
    units: 50,
    bill: 750,
    onReadingChange: vi.fn(),
  };

  it("renders room number and tenant name", () => {
    render(<RoomCard {...defaultProps} />);
    expect(screen.getByText("Room 5")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders bill and units", () => {
    render(<RoomCard {...defaultProps} />);
    expect(screen.getByText("Rs 750.00")).toBeInTheDocument();
    expect(screen.getByText("50.0 units")).toBeInTheDocument();
  });

  it("renders input fields for metered rooms", () => {
    render(<RoomCard {...defaultProps} />);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(2);
  });

  it("does not render inputs for unmetered rooms", () => {
    render(<RoomCard {...defaultProps} meterType="unmetered" previous={0} current={0} units={30} bill={450} />);
    const inputs = screen.queryAllByRole("spinbutton");
    expect(inputs).toHaveLength(0);
  });

  it("shows unmetered badge for unmetered rooms", () => {
    render(<RoomCard {...defaultProps} meterType="unmetered" previous={0} current={0} units={30} bill={450} />);
    expect(screen.getByText("Unmetered")).toBeInTheDocument();
  });

  it("shows warning when current is less than previous", () => {
    render(<RoomCard {...defaultProps} previous={200} current={100} />);
    expect(screen.getByText("Current reading is less than previous")).toBeInTheDocument();
  });

  it("shows missing state when inputs are empty", () => {
    render(<RoomCard {...defaultProps} previous={0} current={0} units={0} bill={0} />);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(null);
    expect(inputs[1]).toHaveValue(null);
  });

  it("shows shared group label for shared rooms", () => {
    render(<RoomCard {...defaultProps} meterType="shared" sharedGroupLabel="Maiya & Sabari (7-8)" />);
    expect(screen.getByText("Maiya & Sabari (7-8)")).toBeInTheDocument();
  });

  it("shows split info when splitWith is provided", () => {
    render(<RoomCard {...defaultProps} splitWith={[6, 7]} />);
    expect(screen.getByText("Shared with Room 6, 7")).toBeInTheDocument();
  });

  it("calls onReadingChange on blur with parsed values", () => {
    const onChange = vi.fn();
    render(<RoomCard {...defaultProps} onReadingChange={onChange} />);
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[0], { target: { value: "200" } });
    fireEvent.change(inputs[1], { target: { value: "300" } });
    fireEvent.blur(inputs[1]);
    expect(onChange).toHaveBeenCalledWith(200, 300);
  });

  it("syncs input state when previous/current props change", () => {
    const { rerender } = render(<RoomCard {...defaultProps} />);
    let inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(100);
    expect(inputs[1]).toHaveValue(150);

    rerender(<RoomCard {...defaultProps} previous={200} current={250} />);
    inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(200);
    expect(inputs[1]).toHaveValue(250);
  });

  it("shows italic placeholder for missing tenant", () => {
    render(<RoomCard {...defaultProps} name="" />);
    expect(screen.getByText("No tenant")).toBeInTheDocument();
  });
});
