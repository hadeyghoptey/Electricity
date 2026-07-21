import { describe, it, expect } from "vitest";

interface CsvRow {
  house: string;
  number: number;
  name: string;
  type: string;
  previous: number;
  current: number;
  units: number;
  bill: number;
}

function generateCsv(rows: CsvRow[]): string {
  const headers = ["House", "Room", "Tenant", "Type", "Previous", "Current", "Units", "Bill"];
  const csvRows = rows.map((r) =>
    [r.house, r.number, r.name, r.type, r.previous, r.current, r.units.toFixed(1), formatCsvCurrency(r.bill)].join(",")
  );
  return [headers.join(","), ...csvRows].join("\n");
}

function formatCsvCurrency(amount: number): string {
  return `Rs ${amount.toFixed(2)}`;
}

describe("CSV export logic", () => {
  it("generates header row", () => {
    const csv = generateCsv([]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("House,Room,Tenant,Type,Previous,Current,Units,Bill");
  });

  it("includes all data rows", () => {
    const rows: CsvRow[] = [
      { house: "Primary", number: 1, name: "John", type: "Separate", previous: 100, current: 150, units: 50, bill: 750 },
      { house: "Secondary", number: 2, name: "Jane", type: "Shared (G1)", previous: 200, current: 300, units: 100, bill: 1500 },
    ];
    const csv = generateCsv(rows);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Primary");
    expect(lines[1]).toContain("50.0");
    expect(lines[1]).toContain("Rs 750.00");
    expect(lines[2]).toContain("Secondary");
    expect(lines[2]).toContain("Rs 1500.00");
  });

  it("handles empty tenant name", () => {
    const rows: CsvRow[] = [
      { house: "Primary", number: 1, name: "", type: "Separate", previous: 0, current: 0, units: 0, bill: 0 },
    ];
    const csv = generateCsv(rows);
    expect(csv).toContain("Primary,1,,Separate,0,0,0.0,Rs 0.00");
  });

  it("handles floating point values correctly", () => {
    const rows: CsvRow[] = [
      { house: "Primary", number: 1, name: "Test", type: "Separate", previous: 100.5, current: 150.75, units: 50.25, bill: 753.75 },
    ];
    const csv = generateCsv(rows);
    expect(csv).toContain("100.5,150.75,50.3,Rs 753.75");
  });
});
