"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/Toaster";
import { formatCurrency } from "@/lib/utils";
import { Save, RotateCcw } from "lucide-react";

interface RoomEdit {
  id: string;
  number: number;
  name: string;
  meterType: string;
  houseSlug: string;
}

interface HouseData {
  id: string;
  name: string;
  slug: string;
  rooms: RoomEdit[];
}

export default function AdminPage() {
  const [houses, setHouses] = useState<HouseData[]>([]);
  const [unitPrice, setUnitPrice] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/houses/primary").then((r) => r.json()),
      fetch("/api/houses/secondary").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ]).then(([pHouse, sHouse, config]) => {
      const mapHouse = (h: Record<string, unknown>): HouseData => ({
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
      });
      setHouses([mapHouse(pHouse), mapHouse(sHouse)]);
      setUnitPrice(config.unitPrice ?? 15);
      setLoading(false);
    });
  }, []);

  const handleNameChange = async (roomId: string, name: string) => {
    setHouses((prev) =>
      prev.map((h) => ({
        ...h,
        rooms: h.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)),
      }))
    );
  };

  const handleTypeChange = async (roomId: string, meterType: string) => {
    setHouses((prev) =>
      prev.map((h) => ({
        ...h,
        rooms: h.rooms.map((r) => (r.id === roomId ? { ...r, meterType } : r)),
      }))
    );
  };

  const saveRoom = async (roomId: string) => {
    const room = houses.flatMap((h) => h.rooms).find((r) => r.id === roomId);
    if (!room) return;
    await fetch("/api/rooms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, name: room.name, meterType: room.meterType }),
    });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitPrice }),
      });

      for (const house of houses) {
        for (const room of house.rooms) {
          await fetch("/api/rooms", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: room.id, name: room.name, meterType: room.meterType }),
          });
        }
      }

      toast("All settings saved!", "success");
    } catch {
      toast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">⚙️ Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage settings, rooms, and tenants</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save All Changes
        </button>
      </div>

      {/* Unit Price */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">💰 Electricity Price</h2>
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Price per unit (Rs)</label>
            <input
              type="number"
              step="0.5"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              className="w-28 px-3 py-2 rounded-lg bg-muted border border-border text-lg font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Current rate: <span className="text-foreground font-medium">{formatCurrency(1)}</span> per unit
          </div>
        </div>
      </div>

      {/* Room Lists */}
      {houses.map((house) => (
        <div key={house.id} className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {house.name} <span className="text-sm font-normal text-muted-foreground">({house.rooms.length} rooms)</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs uppercase tracking-wider">Room</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs uppercase tracking-wider">Tenant Name</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs uppercase tracking-wider">Meter Type</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {house.rooms.map((room) => (
                  <tr key={room.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-2 font-medium text-foreground">{room.number}</td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => handleNameChange(room.id, e.target.value)}
                        placeholder="Enter tenant name"
                        className="w-full max-w-[200px] px-2 py-1 rounded bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <select
                        value={room.meterType}
                        onChange={(e) => handleTypeChange(room.id, e.target.value)}
                        className="px-2 py-1 rounded bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="separate">Separate</option>
                        <option value="shared">Shared</option>
                        <option value="unmetered">Unmetered</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => saveRoom(room.id)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">🔄 Reset Data</h2>
        <p className="text-xs text-muted-foreground mb-3">
          This will clear all meter readings for all rooms. Room configurations and tenant names will be preserved.
        </p>
        <button
          onClick={async () => {
            if (confirm("Are you sure? This will delete all meter readings.")) {
              toast("Reset feature: run `prisma migrate reset --force` in terminal", "info");
            }
          }}
          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-colors"
        >
          Reset All Readings
        </button>
      </div>
    </div>
  );
}
