"use client";

import { useHouseData } from "@/hooks/useHouseData";
import { RoomCard } from "@/components/RoomCard";
import { SummaryCards } from "@/components/SummaryCards";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatCurrency, formatNumber, getMonthLabel, generateMonths } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

const HOUSE_META: Record<string, { emoji: string; name: string }> = {
  primary: { emoji: "🏠", name: "Primary House" },
  secondary: { emoji: "🏢", name: "Secondary House" },
};

export default function HousePage({ slug }: { slug: string }) {
  const { data, loading, error, month, setMonth, updateReading, updateExtraMeter } = useHouseData(slug);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const meta = HOUSE_META[slug] ?? { emoji: "🏠", name: "House" };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
        <p className="text-red-400 font-medium">Error loading data</p>
        <p className="text-sm text-red-400/70 mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const months = generateMonths(12);
  const monthIdx = months.indexOf(month);

  const goPrevMonth = () => {
    const idx = months.indexOf(month);
    if (idx > 0) setMonth(months[idx - 1]);
  };

  const goNextMonth = () => {
    const idx = months.indexOf(month);
    if (idx < months.length - 1) setMonth(months[idx + 1]);
  };

  const updateSharedGroup = (groupKey: string, prev: number, curr: number) => {
    const group = data.shared.find((g) => g.groupKey === groupKey);
    if (!group) return;
    for (const r of group.rooms) {
      updateReading(r.roomId, prev, curr);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{meta.emoji} {meta.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data.separate.length + data.shared.reduce((s, g) => s + g.rooms.length, 0) + data.unmetered.length} rooms
            &middot; Rs {data.unitPrice}/unit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goPrevMonth}
            disabled={monthIdx <= 0}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30"
            aria-label="Previous month"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowAllMonths(!showAllMonths)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors min-w-[130px] md:min-w-[150px] text-center"
            >
              {getMonthLabel(month)}
            </button>
            {showAllMonths && (
              <div className="absolute top-full mt-1 right-0 bg-card border border-border rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto min-w-[160px]">
                {months.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMonth(m); setShowAllMonths(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                      m === month ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {getMonthLabel(m)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={goNextMonth}
            disabled={monthIdx >= months.length - 1}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30"
            aria-label="Next month"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <SummaryCards
        roomTotalBill={data.roomTotalBill}
        extraTotalBill={data.extraTotalBill}
        grandTotal={data.grandTotal}
        totalUnits={data.totalUnits}
        mainMeterUnits={data.mainMeter?.units ?? 0}
        lossFromMain={data.lossFromMain}
        lossPercent={data.lossPercent}
        unitPrice={data.unitPrice}
        unmeteredCount={data.unmeteredCount}
      />

      {/* Extra Meters */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">📊 Main & Water Meters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {data.extraMeters.map((m) => (
            <div key={m.id} className="bg-muted/30 rounded-lg p-3 md:p-4 border border-border">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-sm font-medium text-foreground">{m.label}</span>
                {m.type === "main" ? (
                  <span className="text-xs text-amber-400 font-medium">{formatNumber(m.units)} units</span>
                ) : (
                  <span className="text-xs text-emerald-400 font-medium">{formatCurrency(m.bill)}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Previous</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0"
                    defaultValue={m.previous || ""}
                    onBlur={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      updateExtraMeter(m.id, p, m.current);
                    }}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Current</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0"
                    defaultValue={m.current || ""}
                    onBlur={(e) => {
                      const c = parseFloat(e.target.value) || 0;
                      updateExtraMeter(m.id, m.previous, c);
                    }}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {data.mainMeter && (
          <div className="mt-3 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2 md:p-3">
            Main meter: {formatNumber(data.mainMeter.units)} units = Rs {formatCurrency(data.mainMeter.units * data.unitPrice)}
            &nbsp;&middot; Unmetered: {formatNumber(data.unmeteredUnits)} units split among {data.unmeteredCount} rooms
            = {formatNumber(data.perUnmeteredUnits)} each
          </div>
        )}
      </div>

      {/* Separate Rooms */}
      {data.separate.length > 0 && (
        <div>
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-3">🏠 Separate Meters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {data.separate.map((r) => (
              <RoomCard
                key={r.roomId}
                number={r.number}
                name={r.name}
                meterType={r.meterType}
                previous={r.previous}
                current={r.current}
                units={r.units}
                bill={r.bill}
                onReadingChange={(prev, curr) => updateReading(r.roomId, prev, curr)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Shared Groups */}
      {data.shared.length > 0 && (
        <div>
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-3">🔗 Shared Meters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {data.shared.map((g) => (
              <div key={g.groupKey} className="rounded-xl border border-violet-500/20 bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">{g.label}</span>
                  <span className="text-xs text-muted-foreground">{formatNumber(g.totalUnits)} total units</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Previous</label>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0"
                      defaultValue={g.previous || ""}
                      onBlur={(e) => {
                        const p = parseFloat(e.target.value) || 0;
                        updateSharedGroup(g.groupKey, p, g.current);
                      }}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Current</label>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0"
                      defaultValue={g.current || ""}
                      onBlur={(e) => {
                        const c = parseFloat(e.target.value) || 0;
                        updateSharedGroup(g.groupKey, g.previous, c);
                      }}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="divide-y divide-border/50">
                  {g.rooms.map((r) => (
                    <div key={r.roomId} className="flex items-center justify-between py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Room {r.number}</span>
                        {r.name && <span className="text-muted-foreground text-xs">{r.name}</span>}
                      </div>
                      <span className="text-emerald-400 font-medium">{formatCurrency(r.bill)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unmetered */}
      {data.unmetered.length > 0 && (
        <div>
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-3">❓ Unmetered Rooms</h2>
          <div className="rounded-xl border border-orange-500/20 bg-card p-3 md:p-4 mb-3">
            <p className="text-xs text-muted-foreground">
              Main meter ({formatNumber(data.mainMeter?.units ?? 0)} units) − metered rooms ({formatNumber(data.totalMeteredUnits)} units)
              = {formatNumber(data.unmeteredUnits)} units &divide; {data.unmeteredCount} rooms
              = {formatNumber(data.perUnmeteredUnits)} units each
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {data.unmetered.map((r) => (
              <RoomCard
                key={r.roomId}
                number={r.number}
                name={r.name}
                meterType={r.meterType}
                previous={0}
                current={0}
                units={r.units}
                bill={r.bill}
                onReadingChange={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
