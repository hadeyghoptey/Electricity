import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Banknote, Zap, Gauge, TrendingDown } from "lucide-react";

interface SummaryCardsProps {
  roomTotalBill: number;
  extraTotalBill: number;
  grandTotal: number;
  totalUnits: number;
  mainMeterUnits: number;
  lossFromMain: number;
  lossPercent: number;
  unitPrice: number;
  unmeteredCount: number;
}

export function SummaryCards({
  roomTotalBill,
  extraTotalBill,
  grandTotal,
  totalUnits,
  mainMeterUnits,
  lossFromMain,
  lossPercent,
  unitPrice,
  unmeteredCount,
}: SummaryCardsProps) {
  const cards = [
    {
      label: "Room Collection",
      value: formatCurrency(roomTotalBill),
      sub: `${formatNumber(totalUnits)} units @ Rs ${unitPrice}`,
      icon: Banknote,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Water / Extra",
      value: formatCurrency(extraTotalBill),
      sub: "Khanepani + Melamchi",
      icon: Zap,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Grand Total",
      value: formatCurrency(grandTotal),
      sub: `${formatNumber(mainMeterUnits)} main meter units`,
      icon: Gauge,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Unmetered / Loss",
      value: `${formatNumber(lossPercent, 1)}%`,
      sub: `${formatNumber(lossFromMain)} units (${unmeteredCount} rooms)`,
      icon: TrendingDown,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.bg)}>
                <Icon className={cn("w-4 h-4", card.color)} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
