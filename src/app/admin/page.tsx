"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/Toaster";
import { formatCurrency, mapAdminHouseData, type AdminHouseData } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { apiUrl } from "@/lib/api";
import { Save, RotateCcw, Trash2 } from "lucide-react";

export default function AdminPage() {
  const [houses, setHouses] = useState<AdminHouseData[]>([]);
  const [unitPrice, setUnitPrice] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(apiUrl("/api/houses/primary")).then((r) => r.json()),
      fetch(apiUrl("/api/houses/secondary")).then((r) => r.json()),
      fetch(apiUrl("/api/config")).then((r) => r.json()),
    ]).then(([pHouse, sHouse, config]) => {
      setHouses([mapAdminHouseData(pHouse), mapAdminHouseData(sHouse)]);
      setUnitPrice(config.unitPrice ?? 15);
      setLoading(false);
    });
  }, []);

  const handleNameChange = (roomId: string, name: string) => {
    setHouses((prev) =>
      prev.map((h) => ({
        ...h,
        rooms: h.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)),
      }))
    );
  };

  const handleTypeChange = (roomId: string, meterType: string) => {
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
    setSavingRoomId(roomId);
    try {
      const res = await fetch(apiUrl("/api/rooms"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, name: room.name, meterType: room.meterType }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast(`Room ${room.number} saved`, "success");
    } catch {
      toast(`Failed to save Room ${room.number}`, "error");
    } finally {
      setSavingRoomId(null);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const configRes = await fetch(apiUrl("/api/config"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitPrice }),
      });
      if (!configRes.ok) throw new Error("Failed to save config");

      const promises = houses.flatMap((house) =>
        house.rooms.map((room) =>
           fetch(apiUrl("/api/rooms"), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: room.id, name: room.name, meterType: room.meterType }),
          }).then((r) => {
            if (!r.ok) throw new Error(`Failed to save Room ${room.number}`);
          })
        )
      );
      await Promise.all(promises);
      toast("All settings saved!", "success");
    } catch {
      toast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const resetReadings = async () => {
    if (!confirm("Are you sure? This will delete all meter readings for all rooms and meters.")) return;
    setResetting(true);
    try {
      const res = await fetch(apiUrl("/api/readings"), { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reset readings");
      toast("All readings have been reset", "success");
    } catch {
      toast("Failed to reset readings", "error");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
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
                        disabled={savingRoomId === room.id}
                        className="text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                      >
                        {savingRoomId === room.id ? "..." : "Save"}
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
          onClick={resetReadings}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {resetting ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Reset All Readings
        </button>
      </div>
    </div>
  );
}
