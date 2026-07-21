"use client";

import { useEffect, useState } from "react";
import { calculateHouse, type HouseRawData, type HouseCalcResult } from "@/lib/calculations";
import { formatCurrency, formatNumber, getCurrentMonth, getMonthLabel, generateMonths, mapHouseRawData } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { apiUrl } from "@/lib/api";
import { Download, FileText, Printer } from "lucide-react";

export default function ReportsPage() {
  const [primary, setPrimary] = useState<HouseRawData | null>(null);
  const [secondary, setSecondary] = useState<HouseRawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const months = generateMonths(12);

  useEffect(() => {
    Promise.all([
      fetch(apiUrl("/api/houses/primary")).then((r) => r.json()),
      fetch(apiUrl("/api/houses/secondary")).then((r) => r.json()),
      fetch(apiUrl("/api/config")).then((r) => r.json()),
    ])
      .then(([pHouse, sHouse, config]) => {
        setPrimary(mapHouseRawData(pHouse, { unitPrice: config.unitPrice as number }));
        setSecondary(mapHouseRawData(sHouse, { unitPrice: config.unitPrice as number }));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const pCalc = primary ? calculateHouse(primary, selectedMonth) : null;
  const sCalc = secondary ? calculateHouse(secondary, selectedMonth) : null;

  function getAllRoomEntries(calc: HouseCalcResult, houseLabel: string) {
    const entries: Array<{
      house: string;
      number: number;
      name: string;
      type: string;
      previous: number;
      current: number;
      units: number;
      bill: number;
    }> = [];

    for (const r of calc.separate) {
      entries.push({ house: houseLabel, number: r.number, name: r.name, type: "Separate", previous: r.previous, current: r.current, units: r.units, bill: r.bill });
    }
    for (const g of calc.shared) {
      for (const r of g.rooms) {
        entries.push({
          house: houseLabel,
          number: r.number,
          name: r.name,
          type: `Shared (${g.label})`,
          previous: g.previous,
          current: g.current,
          units: r.units,
          bill: r.bill,
        });
      }
    }
    for (const r of calc.unmetered) {
      entries.push({ house: houseLabel, number: r.number, name: r.name, type: "Unmetered", previous: r.previous, current: r.current, units: r.units, bill: r.bill });
    }
    return entries;
  }

  const allRooms = [
    ...(pCalc ? getAllRoomEntries(pCalc, "Primary") : []),
    ...(sCalc ? getAllRoomEntries(sCalc, "Secondary") : []),
  ];

  const allExtraMeters = [
    ...(pCalc ? pCalc.extraMeters.map((m) => ({ ...m, house: "Primary" })) : []),
    ...(sCalc ? sCalc.extraMeters.map((m) => ({ ...m, house: "Secondary" })) : []),
  ];

  const exportCSV = () => {
    const headers = ["House", "Room", "Tenant", "Type", "Previous", "Current", "Units", "Bill"];
    const rows = allRooms.map((r) =>
      [r.house, r.number, r.name, r.type, r.previous, r.current, formatNumber(r.units), formatCurrency(r.bill)].join(",")
    );
    const extraRows = allExtraMeters.map((m) =>
      [m.house, m.label, "", m.type, m.previous, m.current, formatNumber(m.units), formatCurrency(m.bill)].join(",")
    );
    const csv = [headers.join(","), ...rows, ...extraRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `electricity-report-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">📄 Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monthly breakdown by room</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {months.map((m) => (
              <option key={m} value={m}>{getMonthLabel(m)}</option>
            ))}
          </select>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[pCalc, sCalc].map((calc, i) => {
          if (!calc) return null;
          const label = i === 0 ? "Primary" : "Secondary";
          return (
            <div key={label} className="rounded-xl border border-border bg-card p-3 md:p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
              <p className="text-lg md:text-xl font-bold text-foreground">{formatCurrency(calc.roomTotalBill)}</p>
              <p className="text-xs text-muted-foreground">{formatNumber(calc.totalUnits)} units</p>
            </div>
          );
        })}
        <div className="rounded-xl border border-border bg-card p-3 md:p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Combined Total</p>
          <p className="text-lg md:text-xl font-bold text-emerald-400">
            {formatCurrency((pCalc?.roomTotalBill ?? 0) + (sCalc?.roomTotalBill ?? 0))}
          </p>
          <p className="text-xs text-muted-foreground">
            {(pCalc?.totalUnits ?? 0) + (sCalc?.totalUnits ?? 0)} units total
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 md:p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Grand Total</p>
          <p className="text-lg md:text-xl font-bold text-amber-400">
            {formatCurrency((pCalc?.grandTotal ?? 0) + (sCalc?.grandTotal ?? 0))}
          </p>
          <p className="text-xs text-muted-foreground">{getMonthLabel(selectedMonth)}</p>
        </div>
      </div>

      {/* Room Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-3 md:p-4 border-b border-border flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <h2 className="text-sm font-semibold text-foreground">Room-wise Breakdown</h2>
          <span className="text-xs text-muted-foreground ml-auto">{allRooms.length} entries</span>
        </div>
        <div className="overflow-x-auto -mx-3 md:mx-0">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap">House</th>
                <th className="text-left py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap">Room</th>
                <th className="text-left py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Tenant</th>
                <th className="text-left py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Type</th>
                <th className="text-right py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Previous</th>
                <th className="text-right py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Current</th>
                <th className="text-right py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap">Units</th>
                <th className="text-right py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap">Bill</th>
              </tr>
            </thead>
            <tbody>
              {allRooms.map((r, i) => (
                <tr key={i} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-2 px-3 md:px-4 text-muted-foreground">{r.house}</td>
                  <td className="py-2 px-3 md:px-4 font-medium text-foreground">{r.number}</td>
                  <td className="py-2 px-3 md:px-4 text-muted-foreground hidden sm:table-cell">{r.name || <span className="italic">—</span>}</td>
                  <td className="py-2 px-3 md:px-4 hidden md:table-cell">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${
                      r.type === "Separate" ? "bg-emerald-500/10 text-emerald-400" :
                      r.type.startsWith("Shared") ? "bg-violet-500/10 text-violet-400" :
                      "bg-orange-500/10 text-orange-400"
                    }`}>{r.type}</span>
                  </td>
                  <td className="py-2 px-3 md:px-4 text-right text-muted-foreground hidden md:table-cell">{formatNumber(r.previous)}</td>
                  <td className="py-2 px-3 md:px-4 text-right text-muted-foreground hidden md:table-cell">{formatNumber(r.current)}</td>
                  <td className="py-2 px-3 md:px-4 text-right text-foreground font-medium">{formatNumber(r.units)}</td>
                  <td className="py-2 px-3 md:px-4 text-right text-emerald-400 font-medium">{formatCurrency(r.bill)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                <td colSpan={6} className="py-2.5 px-3 md:px-4 text-right font-bold text-foreground text-xs md:text-sm">Totals</td>
                <td className="py-2.5 px-3 md:px-4 text-right font-bold text-foreground text-xs md:text-sm">
                  {formatNumber(allRooms.reduce((s, r) => s + r.units, 0))}
                </td>
                <td className="py-2.5 px-3 md:px-4 text-right font-bold text-emerald-400 text-xs md:text-sm">
                  {formatCurrency(allRooms.reduce((s, r) => s + r.bill, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Extra Meters Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-3 md:p-4 border-b border-border flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <h2 className="text-sm font-semibold text-foreground">Extra Meters</h2>
        </div>
        <div className="overflow-x-auto -mx-3 md:mx-0">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider">House</th>
                <th className="text-left py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider">Meter</th>
                <th className="text-right py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider hidden md:table-cell">Previous</th>
                <th className="text-right py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider hidden md:table-cell">Current</th>
                <th className="text-right py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider">Units</th>
                <th className="text-right py-2.5 px-3 md:px-4 text-muted-foreground font-medium text-[10px] md:text-xs uppercase tracking-wider">Bill</th>
              </tr>
            </thead>
            <tbody>
              {allExtraMeters.map((m, i) => (
                <tr key={i} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-2 px-3 md:px-4 text-muted-foreground">{m.house}</td>
                  <td className="py-2 px-3 md:px-4 font-medium text-foreground">{m.label}</td>
                  <td className="py-2 px-3 md:px-4 text-right text-muted-foreground hidden md:table-cell">{formatNumber(m.previous)}</td>
                  <td className="py-2 px-3 md:px-4 text-right text-muted-foreground hidden md:table-cell">{formatNumber(m.current)}</td>
                  <td className="py-2 px-3 md:px-4 text-right text-foreground font-medium">{formatNumber(m.units)}</td>
                  <td className="py-2 px-3 md:px-4 text-right text-emerald-400 font-medium">
                    {m.type === "main" ? <span className="text-muted-foreground">—</span> : formatCurrency(m.bill)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
