"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatNumber, getCurrentMonth } from "@/lib/utils";
import { calculateHouse, type HouseRawData } from "@/lib/calculations";
import { Zap } from "lucide-react";

export default function DashboardPage() {
  const [primary, setPrimary] = useState<HouseRawData | null>(null);
  const [secondary, setSecondary] = useState<HouseRawData | null>(null);
  const [loading, setLoading] = useState(true);

  const month = getCurrentMonth();

  useEffect(() => {
    Promise.all([
      fetch("/api/houses/primary").then((r) => r.json()),
      fetch("/api/houses/secondary").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ])
      .then(([pHouse, sHouse, config]) => {
        const mapData = (h: Record<string, unknown>): HouseRawData => ({
          houseId: h.id as string,
          houseName: h.name as string,
          unitPrice: config.unitPrice as number,
          rooms: ((h.rooms ?? []) as Array<Record<string, unknown>>).map(
            (r: Record<string, unknown>) => ({
              id: r.id as string,
              number: r.number as number,
              name: r.name as string,
              meterType: r.meterType as string,
              groupKey: (r.groupKey as string) || null,
              readings: (r.readings as Array<{ month: string; previous: number; current: number }>) ?? [],
            })
          ),
          extraMeters: ((h.extraMeters ?? []) as Array<Record<string, unknown>>).map(
            (m: Record<string, unknown>) => ({
              id: m.id as string,
              type: m.type as string,
              label: m.label as string,
              readings: (m.readings as Array<{ month: string; previous: number; current: number }>) ?? [],
            })
          ),
        });
        setPrimary(mapData(pHouse));
        setSecondary(mapData(sHouse));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const pCalc = primary ? calculateHouse(primary, month) : null;
  const sCalc = secondary ? calculateHouse(secondary, month) : null;

  const overallGrand = (pCalc?.grandTotal ?? 0) + (sCalc?.grandTotal ?? 0);
  const overallRoom = (pCalc?.roomTotalBill ?? 0) + (sCalc?.roomTotalBill ?? 0);
  const overallUnits = (pCalc?.totalUnits ?? 0) + (sCalc?.totalUnits ?? 0);
  const overallMain = (pCalc?.mainMeter?.units ?? 0) + (sCalc?.mainMeter?.units ?? 0);
  const overallExtra = (pCalc?.extraTotalBill ?? 0) + (sCalc?.extraTotalBill ?? 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {month} &middot; Overall electricity summary for both properties
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-foreground">{formatCurrency(overallGrand)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Grand Total (incl. water)</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Collection</p>
          <p className="text-xl md:text-2xl font-bold text-emerald-400">{formatCurrency(overallRoom)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{formatNumber(overallUnits)} units</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Main Meter</p>
          <p className="text-xl md:text-2xl font-bold text-amber-400">{formatNumber(overallMain)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">total units purchased</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Water Bills</p>
          <p className="text-xl md:text-2xl font-bold text-blue-400">{formatCurrency(overallExtra)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Khanepani + Melamchi</p>
        </div>
      </div>

      {/* Per-House */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {[pCalc, sCalc].map((calc, i) => {
          if (!calc) return null;
          const label = i === 0 ? "Primary House" : "Secondary House";
          const emoji = i === 0 ? "🏠" : "🏢";
          return (
            <div key={label} className="rounded-xl border border-border bg-card p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-lg font-semibold text-foreground">{emoji} {label}</h2>
                <span className="text-[11px] bg-muted px-2 py-1 rounded-md text-muted-foreground">
                  Rs {calc.unitPrice}/unit
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Collection</p>
                  <p className="text-base md:text-lg font-bold text-emerald-400">{formatCurrency(calc.roomTotalBill)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Units</p>
                  <p className="text-base md:text-lg font-bold text-foreground">{formatNumber(calc.totalUnits)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Main Meter</p>
                  <p className="text-base md:text-lg font-bold text-amber-400">{formatNumber(calc.mainMeter?.units ?? 0)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Loss</p>
                  <p className="text-base md:text-lg font-bold text-red-400">{formatNumber(calc.lossPercent, 1)}%</p>
                </div>
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Grand Total</span>
                <span className="font-bold text-foreground">{formatCurrency(calc.grandTotal)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
