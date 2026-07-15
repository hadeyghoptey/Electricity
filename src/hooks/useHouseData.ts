import { useState, useEffect, useCallback } from "react";
import { getCurrentMonth } from "@/lib/utils";
import type { HouseRawData, HouseCalcResult } from "@/lib/calculations";
import { calculateHouse } from "@/lib/calculations";

interface UseHouseDataReturn {
  data: HouseCalcResult | null;
  loading: boolean;
  error: string | null;
  month: string;
  refresh: () => void;
  setMonth: (m: string) => void;
  updateReading: (roomId: string, prev: number, curr: number) => Promise<void>;
  updateExtraMeter: (meterId: string, prev: number, curr: number) => Promise<void>;
  updateRoom: (roomId: string, updates: { name?: string; meterType?: string }) => Promise<void>;
  updateConfig: (unitPrice: number) => Promise<void>;
}

export function useHouseData(slug: string): UseHouseDataReturn {
  const [raw, setRaw] = useState<HouseRawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/houses/${slug}`).then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ])
      .then(([houseData, configData]) => {
        const rawData: HouseRawData = {
          houseId: houseData.id,
          houseName: houseData.name,
          unitPrice: configData.unitPrice,
          rooms: houseData.rooms.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            number: r.number as number,
            name: r.name as string,
            meterType: r.meterType as string,
            groupKey: (r.groupKey as string) || null,
            readings: (r.readings as Array<{ month: string; previous: number; current: number }>) ?? [],
          })),
          extraMeters: houseData.extraMeters.map((m: Record<string, unknown>) => ({
            id: m.id as string,
            type: m.type as string,
            label: m.label as string,
            readings: (m.readings as Array<{ month: string; previous: number; current: number }>) ?? [],
          })),
        };
        setRaw(rawData);
        setError(null);
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [slug, refreshKey]);

  const data = raw ? calculateHouse(raw, month) : null;

  const updateReading = useCallback(
    async (roomId: string, prev: number, curr: number) => {
      await fetch("/api/readings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, month, previous: prev, current: curr }),
      });
      refresh();
    },
    [month, refresh]
  );

  const updateExtraMeter = useCallback(
    async (meterId: string, prev: number, curr: number) => {
      await fetch("/api/extra-meters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meterId, month, previous: prev, current: curr }),
      });
      refresh();
    },
    [month, refresh]
  );

  const updateRoom = useCallback(
    async (roomId: string, updates: { name?: string; meterType?: string }) => {
      await fetch("/api/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, ...updates }),
      });
      refresh();
    },
    [refresh]
  );

  const updateConfig = useCallback(
    async (unitPrice: number) => {
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitPrice }),
      });
      refresh();
    },
    [refresh]
  );

  return { data, loading, error, month, refresh, setMonth, updateReading, updateExtraMeter, updateRoom, updateConfig };
}
