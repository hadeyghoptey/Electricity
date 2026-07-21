import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { HouseRawData } from "@/lib/calculations";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `Rs ${amount.toFixed(2)}`;
}

export function formatNumber(num: number, decimals = 1): string {
  return num.toFixed(decimals);
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[parseInt(m) - 1]} ${year}`;
}

export function generateMonths(count = 12): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export function mapHouseRawData(
  house: Record<string, unknown>,
  config: { unitPrice: number }
): HouseRawData {
  return {
    houseId: house.id as string,
    houseName: house.name as string,
    unitPrice: config.unitPrice,
    rooms: ((house.rooms ?? []) as Array<Record<string, unknown>>).map(
      (r: Record<string, unknown>) => ({
        id: r.id as string,
        number: r.number as number,
        name: r.name as string,
        meterType: r.meterType as string,
        groupKey: (r.groupKey as string) || null,
        readings: (r.readings as Array<{ month: string; previous: number; current: number }>) ?? [],
      })
    ),
    extraMeters: ((house.extraMeters ?? []) as Array<Record<string, unknown>>).map(
      (m: Record<string, unknown>) => ({
        id: m.id as string,
        type: m.type as string,
        label: m.label as string,
        readings: (m.readings as Array<{ month: string; previous: number; current: number }>) ?? [],
      })
    ),
  };
}

export interface MonthlyDataPoint {
  month: string;
  label: string;
  totalUnits: number;
  mainUnits: number;
}

export function computeMonthlyUsage(data: HouseRawData): MonthlyDataPoint[] {
  const monthMap = new Map<string, { roomUnits: number; mainUnits: number }>();

  for (const room of data.rooms) {
    for (const r of room.readings) {
      if (!monthMap.has(r.month)) {
        monthMap.set(r.month, { roomUnits: 0, mainUnits: 0 });
      }
      const units = Math.max(0, r.current - r.previous);
      monthMap.get(r.month)!.roomUnits += units;
    }
  }

  for (const meter of data.extraMeters) {
    if (meter.type !== "main") continue;
    for (const r of meter.readings) {
      if (!monthMap.has(r.month)) {
        monthMap.set(r.month, { roomUnits: 0, mainUnits: 0 });
      }
      const units = Math.max(0, r.current - r.previous);
      monthMap.get(r.month)!.mainUnits = units;
    }
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      month,
      label: getMonthLabel(month),
      totalUnits: d.roomUnits,
      mainUnits: d.mainUnits,
    }));
}

export interface AdminHouseData {
  id: string;
  name: string;
  slug: string;
  rooms: AdminRoomData[];
}

export interface AdminRoomData {
  id: string;
  number: number;
  name: string;
  meterType: string;
  houseSlug: string;
}

export function mapAdminHouseData(h: Record<string, unknown>): AdminHouseData {
  return {
    id: h.id as string,
    name: h.name as string,
    slug: h.slug as string,
    rooms: ((h.rooms ?? []) as Array<Record<string, unknown>>).map(
      (r: Record<string, unknown>) => ({
        id: r.id as string,
        number: r.number as number,
        name: (r.name as string) ?? "",
        meterType: (r.meterType as string) ?? "separate",
        houseSlug: h.slug as string,
      })
    ),
  };
}
