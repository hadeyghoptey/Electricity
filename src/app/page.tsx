"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency, formatNumber, getCurrentMonth, mapHouseRawData } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { calculateHouse, type HouseRawData } from "@/lib/calculations";
import { apiUrl } from "@/lib/api";
import { Zap, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [primary, setPrimary] = useState<HouseRawData | null>(null);
  const [secondary, setSecondary] = useState<HouseRawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const month = getCurrentMonth();

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(apiUrl("/api/houses/primary")).then(async (r) => { if (!r.ok) throw new Error("Failed to load Primary House"); return r.json(); }),
      fetch(apiUrl("/api/houses/secondary")).then(async (r) => { if (!r.ok) throw new Error("Failed to load Secondary House"); return r.json(); }),
      fetch(apiUrl("/api/config")).then(async (r) => { if (!r.ok) throw new Error("Failed to load config"); return r.json(); }),
    ])
      .then(([pHouse, sHouse, config]) => {
        if (cancelled) return;
        setPrimary(mapHouseRawData(pHouse, { unitPrice: config.unitPrice as number }));
        setSecondary(mapHouseRawData(sHouse, { unitPrice: config.unitPrice as number }));
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
        <p className="text-red-400 font-medium">Error loading dashboard</p>
        <p className="text-sm text-red-400/70 mt-1">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!primary || !secondary) return null;

  const pCalc = calculateHouse(primary, month);
  const sCalc = calculateHouse(secondary, month);

  const overallGrand = pCalc.grandTotal + sCalc.grandTotal;
  const overallRoom = pCalc.roomTotalBill + sCalc.roomTotalBill;
  const overallUnits = pCalc.totalUnits + sCalc.totalUnits;
  const overallMain = (pCalc.mainMeter?.units ?? 0) + (sCalc.mainMeter?.units ?? 0);
  const overallExtra = pCalc.extraTotalBill + sCalc.extraTotalBill;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {month} &middot; Overall electricity summary for both properties
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors self-start"
          aria-label="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
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
          const label = i === 0 ? "Primary House" : "Secondary House";
          return (
            <div key={label} className="rounded-xl border border-border bg-card p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-lg font-semibold text-foreground">{label}</h2>
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
