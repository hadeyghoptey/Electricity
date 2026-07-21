import { useState, useEffect, useCallback, useRef } from "react";
import { getCurrentMonth, mapHouseRawData } from "@/lib/utils";
import type { HouseRawData, HouseCalcResult } from "@/lib/calculations";
import { calculateHouse } from "@/lib/calculations";
import { apiUrl } from "@/lib/api";

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
  const isFirstLoad = useRef(true);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (isFirstLoad.current) {
      setLoading(true);
      isFirstLoad.current = false;
    }
    setError(null);
    Promise.all([
      fetch(apiUrl(`/api/houses/${slug}`)).then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load house: ${r.statusText}`);
        return r.json();
      }),
      fetch(apiUrl("/api/config")).then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load config: ${r.statusText}`);
        return r.json();
      }),
    ])
      .then(([houseData, configData]) => {
        if (cancelled) return;
        const rawData = mapHouseRawData(houseData, { unitPrice: configData.unitPrice });
        setRaw(rawData);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug, refreshKey]);

  const data = raw ? calculateHouse(raw, month) : null;

  const updateReading = useCallback(
    async (roomId: string, prev: number, curr: number) => {
      const res = await fetch(apiUrl("/api/readings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, month, previous: prev, current: curr }),
      });
      if (!res.ok) throw new Error("Failed to save reading");
      setRaw((prevRaw) => {
        if (!prevRaw) return prevRaw;
        return {
          ...prevRaw,
          rooms: prevRaw.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  readings: [
                    ...r.readings.filter((rd) => rd.month !== month),
                    { month, previous: prev, current: curr },
                  ],
                }
              : r
          ),
        };
      });
    },
    [month]
  );

  const updateExtraMeter = useCallback(
    async (meterId: string, prev: number, curr: number) => {
      const res = await fetch(apiUrl("/api/extra-meters"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meterId, month, previous: prev, current: curr }),
      });
      if (!res.ok) throw new Error("Failed to save meter reading");
      setRaw((prevRaw) => {
        if (!prevRaw) return prevRaw;
        return {
          ...prevRaw,
          extraMeters: prevRaw.extraMeters.map((m) =>
            m.id === meterId
              ? {
                  ...m,
                  readings: [
                    ...m.readings.filter((rd) => rd.month !== month),
                    { month, previous: prev, current: curr },
                  ],
                }
              : m
          ),
        };
      });
    },
    [month]
  );

  const updateRoom = useCallback(
    async (roomId: string, updates: { name?: string; meterType?: string }) => {
      const res = await fetch(apiUrl("/api/rooms"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to update room");
      refresh();
    },
    [refresh]
  );

  const updateConfig = useCallback(
    async (unitPrice: number) => {
      const res = await fetch(apiUrl("/api/config"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitPrice }),
      });
      if (!res.ok) throw new Error("Failed to update config");
      refresh();
    },
    [refresh]
  );

  return { data, loading, error, month, refresh, setMonth, updateReading, updateExtraMeter, updateRoom, updateConfig };
}
