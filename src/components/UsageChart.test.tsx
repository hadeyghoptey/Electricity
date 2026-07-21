import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { UsageChart } from "./UsageChart";
import type { MonthlyDataPoint } from "@/lib/utils";

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("UsageChart", () => {
  const primaryData: MonthlyDataPoint[] = [
    { month: "2026-06", label: "June 2026", totalUnits: 500, mainUnits: 800 },
    { month: "2026-07", label: "July 2026", totalUnits: 600, mainUnits: 900 },
  ];

  const secondaryData: MonthlyDataPoint[] = [
    { month: "2026-06", label: "June 2026", totalUnits: 300, mainUnits: 500 },
    { month: "2026-07", label: "July 2026", totalUnits: 400, mainUnits: 600 },
  ];

  it("renders the chart title", () => {
    render(<UsageChart primaryData={primaryData} secondaryData={secondaryData} />);
    expect(screen.getByText("Usage Trend")).toBeInTheDocument();
  });

  it("renders nothing when both datasets are empty", () => {
    const { container } = render(<UsageChart primaryData={[]} secondaryData={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders chart when only primary has data", () => {
    render(<UsageChart primaryData={primaryData} secondaryData={[]} />);
    expect(screen.getByText("Usage Trend")).toBeInTheDocument();
  });

  it("renders chart when only secondary has data", () => {
    render(<UsageChart primaryData={[]} secondaryData={secondaryData} />);
    expect(screen.getByText("Usage Trend")).toBeInTheDocument();
  });

  it("handles mismatched month sets", () => {
    const pData: MonthlyDataPoint[] = [
      { month: "2026-05", label: "May 2026", totalUnits: 400, mainUnits: 700 },
    ];
    const sData: MonthlyDataPoint[] = [
      { month: "2026-07", label: "July 2026", totalUnits: 400, mainUnits: 600 },
    ];
    render(<UsageChart primaryData={pData} secondaryData={sData} />);
    expect(screen.getByText("Usage Trend")).toBeInTheDocument();
  });
});
