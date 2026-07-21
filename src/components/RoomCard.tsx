"use client";

import { useState, useEffect } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Zap, Users, HelpCircle } from "lucide-react";

interface RoomCardProps {
  number: number;
  name: string;
  meterType: string;
  previous: number;
  current: number;
  units: number;
  bill: number;
  sharedGroupLabel?: string | null;
  splitWith?: number[];
  onReadingChange: (prev: number, curr: number) => void;
}

const typeConfig = {
  separate: { icon: Zap, color: "text-emerald-400" },
  shared: { icon: Users, color: "text-violet-400" },
  unmetered: { icon: HelpCircle, color: "text-orange-400" },
} as const;

export function RoomCard({
  number,
  name,
  meterType,
  previous,
  current,
  units,
  bill,
  sharedGroupLabel,
  splitWith,
  onReadingChange,
}: RoomCardProps) {
  const [prevInput, setPrevInput] = useState(String(previous || ""));
  const [currInput, setCurrInput] = useState(String(current || ""));

  useEffect(() => {
    setPrevInput(String(previous || ""));
    setCurrInput(String(current || ""));
  }, [previous, current]);

  const handlePrevChange = (val: string) => {
    setPrevInput(val);
  };

  const handleCurrChange = (val: string) => {
    setCurrInput(val);
  };

  const handleBlur = () => {
    onReadingChange(parseFloat(prevInput) || 0, parseFloat(currInput) || 0);
  };

  const curr = parseFloat(currInput) || 0;
  const prev = parseFloat(prevInput) || 0;
  const hasWarning = meterType !== "unmetered" && currInput !== "" && curr < prev;
  const isMissing = meterType !== "unmetered" && (prevInput === "" || currInput === "");

  const cfg = typeConfig[meterType as keyof typeof typeConfig] ?? typeConfig.separate;
  const Icon = cfg.icon;

  return (
    <div className={cn(
      "rounded-lg border p-4 transition-colors",
      hasWarning ? "border-red-500/30 bg-red-500/5" :
        isMissing ? "border-amber-500/20 bg-amber-500/5" :
        "border-border bg-card"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Icon className={cn("w-4 h-4", cfg.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">Room {number}</span>
              {meterType === "shared" && sharedGroupLabel && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 whitespace-nowrap">
                  {sharedGroupLabel}
                </span>
              )}
              {meterType === "unmetered" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 whitespace-nowrap">
                  Unmetered
                </span>
              )}
            </div>
            {name ? (
              <p className="text-xs text-muted-foreground">{name}</p>
            ) : (
              <p className="text-xs text-muted-foreground">No tenant</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-semibold text-emerald-400">{formatCurrency(bill)}</p>
          <p className="text-xs text-muted-foreground">{units.toFixed(1)} units</p>
        </div>
      </div>

      {meterType !== "unmetered" && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-muted-foreground">Previous</label>
            <input
              type="number"
              
              placeholder="0"
              value={prevInput}
              onChange={(e) => handlePrevChange(e.target.value)}
              onBlur={handleBlur}
              className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Current</label>
            <input
              type="number"
              
              placeholder="0"
              value={currInput}
              onChange={(e) => handleCurrChange(e.target.value)}
              onBlur={handleBlur}
              className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {splitWith && splitWith.length > 0 && (
        <p className="text-xs text-violet-400/70 mt-1">
          Shared with Room {splitWith.join(", ")}
        </p>
      )}

      {hasWarning && (
        <p className="text-xs text-red-400 mt-1">Current reading is less than previous</p>
      )}
    </div>
  );
}
