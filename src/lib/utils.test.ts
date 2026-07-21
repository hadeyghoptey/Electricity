import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cn, formatCurrency, formatNumber, getCurrentMonth, getMonthLabel, generateMonths, computeMonthlyUsage } from "./utils";
import type { HouseRawData } from "./calculations";

afterEach(() => {
  vi.useRealTimers();
});

describe("cn", () => {
  it("merges single class string", () => {
    expect(cn("px-4")).toBe("px-4");
  });

  it("merges multiple class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional falsy values", () => {
    expect(cn("px-4", false, null, undefined, 0, "py-2")).toBe("px-4 py-2");
  });

  it("merges tailwind classes correctly, resolving conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("merges tailwind classes with different categories", () => {
    expect(cn("px-4", "bg-red-500", "text-white")).toBe("px-4 bg-red-500 text-white");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles array of classes", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });

  it("handles object syntax with true/false conditions", () => {
    expect(cn({ "px-4": true, "py-2": false })).toBe("px-4");
  });

  it("handles mixed string, array, and object inputs", () => {
    expect(cn("px-4", ["py-2", "bg-red-500"], { "text-white": true, "hidden": false })).toBe(
      "px-4 py-2 bg-red-500 text-white",
    );
  });
});

describe("formatCurrency", () => {
  it("formats positive number with two decimal places", () => {
    expect(formatCurrency(123.45)).toBe("Rs 123.45");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("Rs 0.00");
  });

  it("formats large numbers", () => {
    expect(formatCurrency(9999999.99)).toBe("Rs 9999999.99");
  });

  it("formats negative numbers", () => {
    expect(formatCurrency(-50.5)).toBe("Rs -50.50");
  });

  it("rounds to two decimal places", () => {
    expect(formatCurrency(10.1234)).toBe("Rs 10.12");
  });

  it("pads single decimal digit", () => {
    expect(formatCurrency(5.1)).toBe("Rs 5.10");
  });

  it("formats whole number with .00", () => {
    expect(formatCurrency(42)).toBe("Rs 42.00");
  });

  it("formats very small decimal", () => {
    expect(formatCurrency(0.01)).toBe("Rs 0.01");
  });
});

describe("formatNumber", () => {
  it("uses default of 1 decimal place", () => {
    expect(formatNumber(3.456)).toBe("3.5");
  });

  it("uses custom number of decimal places", () => {
    expect(formatNumber(3.456, 2)).toBe("3.46");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0.0");
  });

  it("formats negative number", () => {
    expect(formatNumber(-7.89)).toBe("-7.9");
  });

  it("formats large number", () => {
    expect(formatNumber(1234567.89, 1)).toBe("1234567.9");
  });

  it("handles 0 decimal places", () => {
    expect(formatNumber(4.567, 0)).toBe("5");
  });

  it("handles 5 decimal places", () => {
    expect(formatNumber(1.23456, 5)).toBe("1.23456");
  });

  it("handles whole number", () => {
    expect(formatNumber(10, 2)).toBe("10.00");
  });

  it("rounds up correctly", () => {
    expect(formatNumber(9.99, 1)).toBe("10.0");
  });
});

describe("getCurrentMonth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns current month in YYYY-MM format", () => {
    vi.setSystemTime(new Date("2026-07-15"));
    expect(getCurrentMonth()).toBe("2026-07");
  });

  it("pads single-digit month with leading zero", () => {
    vi.setSystemTime(new Date("2025-01-01"));
    expect(getCurrentMonth()).toBe("2025-01");
  });

  it("handles December correctly", () => {
    vi.setSystemTime(new Date("2024-12-31"));
    expect(getCurrentMonth()).toBe("2024-12");
  });
});

describe("getMonthLabel", () => {
  it("returns full month name and year for January", () => {
    expect(getMonthLabel("2026-01")).toBe("January 2026");
  });

  it("returns full month name and year for December", () => {
    expect(getMonthLabel("2025-12")).toBe("December 2025");
  });

  it("handles mid-year months", () => {
    expect(getMonthLabel("2026-07")).toBe("July 2026");
  });

  it("handles different years", () => {
    expect(getMonthLabel("2023-03")).toBe("March 2023");
    expect(getMonthLabel("2027-11")).toBe("November 2027");
  });

  it("handles single-digit month without leading zero", () => {
    expect(getMonthLabel("2026-6")).toBe("June 2026");
  });

  it("handles month 09 with leading zero", () => {
    expect(getMonthLabel("2026-09")).toBe("September 2026");
  });

  it("handles month 10 (two-digit)", () => {
    expect(getMonthLabel("2026-10")).toBe("October 2026");
  });
});

describe("generateMonths", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("generates 12 months by default", () => {
    vi.setSystemTime(new Date("2026-07-15"));
    expect(generateMonths()).toHaveLength(12);
  });

  it("generates custom number of months", () => {
    vi.setSystemTime(new Date("2026-07-15"));
    expect(generateMonths(6)).toHaveLength(6);
  });

  it("generates 1 month", () => {
    vi.setSystemTime(new Date("2026-07-15"));
    expect(generateMonths(1)).toEqual(["2026-07"]);
  });

  it("generates months in ascending chronological order", () => {
    vi.setSystemTime(new Date("2026-07-15"));
    const months = generateMonths(4);
    expect(months).toEqual(["2026-04", "2026-05", "2026-06", "2026-07"]);
  });

  it("wraps to previous year when needed", () => {
    vi.setSystemTime(new Date("2026-02-15"));
    const months = generateMonths(4);
    expect(months).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("handles January wrapping to previous year", () => {
    vi.setSystemTime(new Date("2026-01-15"));
    const months = generateMonths(3);
    expect(months).toEqual(["2025-11", "2025-12", "2026-01"]);
  });

  it("generates 0 months", () => {
    vi.setSystemTime(new Date("2026-07-15"));
    expect(generateMonths(0)).toEqual([]);
  });

  it("all entries are in YYYY-MM format", () => {
    vi.setSystemTime(new Date("2026-07-15"));
    const months = generateMonths(24);
    const regex = /^\d{4}-\d{2}$/;
    for (const m of months) {
      expect(m).toMatch(regex);
    }
  });

  it("generates 24 months spanning 2 years", () => {
    vi.setSystemTime(new Date("2026-07-15"));
    const months = generateMonths(24);
    expect(months).toHaveLength(24);
    expect(months[0]).toBe("2024-08");
    expect(months[23]).toBe("2026-07");
  });
});

describe("computeMonthlyUsage", () => {
  function makeHouse(overrides: Partial<HouseRawData> = {}): HouseRawData {
    return {
      houseId: "h1",
      houseName: "Test",
      unitPrice: 15,
      rooms: [],
      extraMeters: [],
      ...overrides,
    };
  }

  it("returns empty array for empty house", () => {
    const data = makeHouse();
    expect(computeMonthlyUsage(data)).toEqual([]);
  });

  it("aggregates single room across multiple months", () => {
    const data = makeHouse({
      rooms: [
        {
          id: "r1", number: 1, name: "", meterType: "separate", groupKey: null,
          readings: [
            { month: "2026-06", previous: 100, current: 150 },
            { month: "2026-07", previous: 150, current: 200 },
          ],
        },
      ],
    });
    const result = computeMonthlyUsage(data);
    expect(result).toHaveLength(2);
    expect(result[0].month).toBe("2026-06");
    expect(result[0].totalUnits).toBe(50);
    expect(result[1].month).toBe("2026-07");
    expect(result[1].totalUnits).toBe(50);
  });

  it("aggregates multiple rooms in same month", () => {
    const data = makeHouse({
      rooms: [
        {
          id: "r1", number: 1, name: "", meterType: "separate", groupKey: null,
          readings: [{ month: "2026-06", previous: 100, current: 150 }],
        },
        {
          id: "r2", number: 2, name: "", meterType: "separate", groupKey: null,
          readings: [{ month: "2026-06", previous: 200, current: 300 }],
        },
      ],
    });
    const result = computeMonthlyUsage(data);
    expect(result).toHaveLength(1);
    expect(result[0].totalUnits).toBe(150); // 50 + 100
  });

  it("includes extraMeter main units", () => {
    const data = makeHouse({
      rooms: [
        {
          id: "r1", number: 1, name: "", meterType: "separate", groupKey: null,
          readings: [{ month: "2026-06", previous: 0, current: 100 }],
        },
      ],
      extraMeters: [
        { id: "m1", type: "main", label: "Main", readings: [{ month: "2026-06", previous: 0, current: 500 }] },
      ],
    });
    const result = computeMonthlyUsage(data);
    expect(result).toHaveLength(1);
    expect(result[0].totalUnits).toBe(100);
    expect(result[0].mainUnits).toBe(500);
  });

  it("ignores non-main extra meters for mainUnits", () => {
    const data = makeHouse({
      extraMeters: [
        { id: "m1", type: "main", label: "Main", readings: [{ month: "2026-06", previous: 0, current: 500 }] },
        { id: "m2", type: "khanepani", label: "Water", readings: [{ month: "2026-06", previous: 0, current: 50 }] },
      ],
    });
    const result = computeMonthlyUsage(data);
    expect(result).toHaveLength(1);
    expect(result[0].mainUnits).toBe(500);
    expect(result[0].totalUnits).toBe(0);
  });

  it("returns sorted months in ascending order", () => {
    const data = makeHouse({
      rooms: [
        {
          id: "r1", number: 1, name: "", meterType: "separate", groupKey: null,
          readings: [
            { month: "2026-03", previous: 0, current: 50 },
            { month: "2026-01", previous: 0, current: 30 },
            { month: "2026-02", previous: 0, current: 40 },
          ],
        },
      ],
    });
    const result = computeMonthlyUsage(data);
    expect(result.map((r) => r.month)).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(result[2].totalUnits).toBe(50);
  });

  it("clamps negative units to zero", () => {
    const data = makeHouse({
      rooms: [
        {
          id: "r1", number: 1, name: "", meterType: "separate", groupKey: null,
          readings: [{ month: "2026-06", previous: 200, current: 100 }],
        },
      ],
    });
    const result = computeMonthlyUsage(data);
    expect(result[0].totalUnits).toBe(0);
  });

  it("includes extra meter months even without room readings", () => {
    const data = makeHouse({
      extraMeters: [
        { id: "m1", type: "main", label: "Main", readings: [{ month: "2026-06", previous: 0, current: 300 }] },
      ],
    });
    const result = computeMonthlyUsage(data);
    expect(result).toHaveLength(1);
    expect(result[0].mainUnits).toBe(300);
    expect(result[0].totalUnits).toBe(0);
  });

  it("includes label in output", () => {
    const data = makeHouse({
      rooms: [
        {
          id: "r1", number: 1, name: "", meterType: "separate", groupKey: null,
          readings: [{ month: "2026-06", previous: 0, current: 50 }],
        },
      ],
    });
    const result = computeMonthlyUsage(data);
    expect(result[0].label).toBe("June 2026");
  });

  it("handles shared and unmetered readings as normal (all counted)", () => {
    const data = makeHouse({
      rooms: [
        {
          id: "r1", number: 1, name: "", meterType: "shared", groupKey: "g1",
          readings: [{ month: "2026-06", previous: 100, current: 200 }],
        },
        {
          id: "r2", number: 2, name: "", meterType: "unmetered", groupKey: null,
          readings: [],
        },
      ],
    });
    const result = computeMonthlyUsage(data);
    expect(result).toHaveLength(1);
    expect(result[0].totalUnits).toBe(100);
  });
});
