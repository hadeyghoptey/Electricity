import { describe, it, expect } from "vitest";
import { calculateHouse, type HouseRawData } from "./calculations";

const defaultMonth = "2026-06";

function room(id: string, opts: {
  number?: number;
  name?: string;
  meterType?: string;
  groupKey?: string | null;
  readings?: Array<{ month: string; previous: number; current: number }>;
} = {}) {
  return {
    id,
    number: opts.number ?? 1,
    name: opts.name ?? "",
    meterType: opts.meterType ?? "separate",
    groupKey: opts.groupKey ?? null,
    readings: opts.readings ?? [],
  };
}

function reading(month: string, previous: number, current: number) {
  return { month, previous, current };
}

describe("calculateHouse", () => {
  describe("basic — separate rooms only", () => {
    it("calculates units and bill for one room", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 15,
        rooms: [
          room("r1", {
            meterType: "separate",
            readings: [reading(defaultMonth, 100, 150)],
          }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.separate).toHaveLength(1);
      expect(result.separate[0].units).toBe(50);
      expect(result.separate[0].bill).toBe(750);
      expect(result.shared).toHaveLength(0);
      expect(result.unmetered).toHaveLength(0);
      expect(result.mainMeter).toBeNull();
      expect(result.roomTotalBill).toBe(750);
      expect(result.extraTotalBill).toBe(0);
      expect(result.grandTotal).toBe(750);
    });

    it("handles multiple separate rooms", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", { number: 1, meterType: "separate", readings: [reading(defaultMonth, 0, 100)] }),
          room("r2", { number: 2, meterType: "separate", readings: [reading(defaultMonth, 50, 80)] }),
          room("r3", { number: 3, meterType: "separate", readings: [reading(defaultMonth, 200, 250)] }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.separate).toHaveLength(3);
      expect(result.separate.map((r) => r.units)).toEqual([100, 30, 50]);
      expect(result.separate.map((r) => r.bill)).toEqual([1000, 300, 500]);
      expect(result.roomTotalBill).toBe(1800);
      expect(result.totalMeteredUnits).toBe(180);
    });
  });

  describe("shared meter groups — equal split", () => {
    it("splits total units equally among group members", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 15,
        rooms: [
          room("r1", { number: 7, meterType: "shared", groupKey: "g1", readings: [reading(defaultMonth, 100, 200)] }),
          room("r2", { number: 8, meterType: "shared", groupKey: "g1", readings: [reading(defaultMonth, 100, 200)] }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.shared).toHaveLength(1);
      const group = result.shared[0];
      expect(group.groupKey).toBe("g1");
      expect(group.totalUnits).toBe(200);
      expect(group.totalBill).toBe(3000);
      expect(group.perRoomUnits).toBe(100);
      expect(group.perRoomBill).toBe(1500);

      expect(group.rooms).toHaveLength(2);
      for (const r of group.rooms) {
        expect(r.units).toBe(100);
        expect(r.bill).toBe(1500);
      }
      expect(group.rooms[0].splitWith).toEqual([8]);
      expect(group.rooms[1].splitWith).toEqual([7]);
    });

    it("handles groups with more than 2 rooms", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", { number: 1, meterType: "shared", groupKey: "g1", readings: [reading(defaultMonth, 10, 20)] }),
          room("r2", { number: 2, meterType: "shared", groupKey: "g1", readings: [reading(defaultMonth, 10, 20)] }),
          room("r3", { number: 3, meterType: "shared", groupKey: "g1", readings: [reading(defaultMonth, 10, 20)] }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      const group = result.shared[0];
      expect(group.totalUnits).toBe(30);
      expect(group.perRoomUnits).toBe(10);
      expect(group.perRoomBill).toBe(100);
      expect(group.rooms).toHaveLength(3);
      for (const r of group.rooms) {
        expect(r.units).toBe(10);
        expect(r.bill).toBe(100);
      }
      expect(result.separate).toHaveLength(0);
      expect(result.totalMeteredUnits).toBe(30);
    });

    it("uses known label for recognised group keys", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 15,
        rooms: [
          room("r1", { meterType: "shared", groupKey: "p-7-8", readings: [reading(defaultMonth, 0, 0)] }),
          room("r2", { meterType: "shared", groupKey: "p-7-8", readings: [reading(defaultMonth, 0, 0)] }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.shared[0].label).toBe("Maiya & Sabari (7-8)");
    });

    it("falls back to generic label for unknown group keys", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 15,
        rooms: [
          room("r1", { meterType: "shared", groupKey: "xyz", readings: [reading(defaultMonth, 0, 0)] }),
          room("r2", { meterType: "shared", groupKey: "xyz", readings: [reading(defaultMonth, 0, 0)] }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.shared[0].label).toBe("Group xyz");
    });
  });

  describe("unmetered rooms", () => {
    it("distributes remaining main meter units equally among unmetered rooms", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", { number: 1, name: "A", meterType: "separate", readings: [reading(defaultMonth, 0, 30)] }),
          room("r2", { number: 2, name: "B", meterType: "unmetered" }),
          room("r3", { number: 3, name: "C", meterType: "unmetered" }),
        ],
        extraMeters: [
          { id: "m1", type: "main", label: "Main Meter", readings: [reading(defaultMonth, 0, 90)] },
        ],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.separate).toHaveLength(1);
      expect(result.separate[0].units).toBe(30);
      expect(result.unmetered).toHaveLength(2);
      expect(result.unmeteredUnits).toBe(60);
      expect(result.perUnmeteredUnits).toBe(30);
      expect(result.perUnmeteredBill).toBe(300);
      for (const r of result.unmetered) {
        expect(r.units).toBe(30);
        expect(r.bill).toBe(300);
      }
      expect(result.totalMeteredUnits).toBe(30);
      expect(result.totalUnits).toBe(90);
    });

    it("handles zero unmetered consumption when main equals metered", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", { meterType: "separate", readings: [reading(defaultMonth, 0, 50)] }),
          room("r2", { meterType: "unmetered" }),
        ],
        extraMeters: [
          { id: "m1", type: "main", label: "Main Meter", readings: [reading(defaultMonth, 0, 50)] },
        ],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.unmeteredUnits).toBe(0);
      expect(result.perUnmeteredUnits).toBe(0);
      expect(result.perUnmeteredBill).toBe(0);
      expect(result.unmetered[0].units).toBe(0);
      expect(result.unmetered[0].bill).toBe(0);
    });

    it("clamps unmetered units to zero when main < metered", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", { meterType: "separate", readings: [reading(defaultMonth, 0, 100)] }),
          room("r2", { meterType: "unmetered" }),
        ],
        extraMeters: [
          { id: "m1", type: "main", label: "Main Meter", readings: [reading(defaultMonth, 0, 50)] },
        ],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.unmeteredUnits).toBe(0);
      expect(result.unmetered[0].units).toBe(0);
      expect(result.unmetered[0].bill).toBe(0);
    });
  });

  describe("extra meters", () => {
    it("calculates main, khanepani and melamchi meters", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 15,
        rooms: [],
        extraMeters: [
          { id: "e1", type: "main", label: "Main Meter", readings: [reading(defaultMonth, 500, 800)] },
          { id: "e2", type: "khanepani", label: "Khanepani", readings: [reading(defaultMonth, 100, 150)] },
          { id: "e3", type: "melamchi", label: "Melamchi", readings: [reading(defaultMonth, 200, 220)] },
        ],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.extraMeters).toHaveLength(3);

      const main = result.extraMeters.find((m) => m.type === "main")!;
      expect(main.units).toBe(300);
      expect(main.bill).toBe(4500);

      const khan = result.extraMeters.find((m) => m.type === "khanepani")!;
      expect(khan.units).toBe(50);
      expect(khan.bill).toBe(750);

      const mel = result.extraMeters.find((m) => m.type === "melamchi")!;
      expect(mel.units).toBe(20);
      expect(mel.bill).toBe(300);

      expect(result.mainMeter?.id).toBe("e1");
      expect(result.extraTotalBill).toBe(750 + 300);
    });

    it("without main meter — mainMeter is null", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 15,
        rooms: [],
        extraMeters: [
          { id: "e1", type: "khanepani", label: "Khanepani", readings: [reading(defaultMonth, 0, 10)] },
        ],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.mainMeter).toBeNull();
      expect(result.extraMeters).toHaveLength(1);
      expect(result.extraTotalBill).toBe(150);
    });
  });

  describe("loss calculation", () => {
    it("loss is always zero by construction (unmetered absorbs surplus)", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", { meterType: "separate", readings: [reading(defaultMonth, 0, 60)] }),
          room("r2", { meterType: "unmetered" }),
        ],
        extraMeters: [
          { id: "m1", type: "main", label: "Main Meter", readings: [reading(defaultMonth, 0, 100)] },
        ],
      };
      const result = calculateHouse(data, defaultMonth);
      // main=100, metered=60, unmetered=40, distributed=100, loss=0
      expect(result.lossFromMain).toBe(0);
      expect(result.lossPercent).toBe(0);
    });

    it("loss percent is 0 when main is 0", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [],
        extraMeters: [
          { id: "m1", type: "main", label: "Main Meter", readings: [reading(defaultMonth, 0, 0)] },
        ],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.lossPercent).toBe(0);
    });
  });

  describe("getLatestReading fallback", () => {
    it("returns exact month reading when available", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", {
            meterType: "separate",
            readings: [
              reading("2026-05", 50, 100),
              reading(defaultMonth, 100, 150),
            ],
          }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.separate[0].previous).toBe(100);
      expect(result.separate[0].current).toBe(150);
      expect(result.separate[0].units).toBe(50);
    });

    it("falls back to last reading (current becomes previous, current=0) when month not found", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", {
            meterType: "separate",
            readings: [
              reading("2026-05", 50, 100),
              reading("2026-04", 20, 50),
            ],
          }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, "2026-06");
      // sorted: 2026-05 > 2026-04 => takes 2026-05: previous = current = 100, current = 0
      expect(result.separate[0].previous).toBe(100);
      expect(result.separate[0].current).toBe(0);
      expect(result.separate[0].units).toBe(0);
    });

    it("returns zeros when no readings at all", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", { meterType: "separate", readings: [] }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.separate[0].previous).toBe(0);
      expect(result.separate[0].current).toBe(0);
      expect(result.separate[0].units).toBe(0);
    });
  });

  describe("negative / zero units handling", () => {
    it("clamps negative units to zero (Math.max)", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", { meterType: "separate", readings: [reading(defaultMonth, 100, 50)] }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.separate[0].units).toBe(0);
      expect(result.separate[0].bill).toBe(0);
    });

    it("zero units results in zero bill", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", { meterType: "separate", readings: [reading(defaultMonth, 100, 100)] }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.separate[0].units).toBe(0);
      expect(result.separate[0].bill).toBe(0);
    });

    it("negative units in extra meters are also clamped", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [],
        extraMeters: [
          { id: "e1", type: "khanepani", label: "Khanepani", readings: [reading(defaultMonth, 50, 30)] },
        ],
      };
      const result = calculateHouse(data, defaultMonth);
      const em = result.extraMeters[0];
      expect(em.units).toBe(0);
      expect(em.bill).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("empty rooms list", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Empty House",
        unitPrice: 10,
        rooms: [],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.separate).toHaveLength(0);
      expect(result.shared).toHaveLength(0);
      expect(result.unmetered).toHaveLength(0);
      expect(result.extraMeters).toHaveLength(0);
      expect(result.mainMeter).toBeNull();
      expect(result.roomTotalBill).toBe(0);
      expect(result.extraTotalBill).toBe(0);
      expect(result.grandTotal).toBe(0);
      expect(result.totalUnits).toBe(0);
      expect(result.lossFromMain).toBe(0);
      expect(result.lossPercent).toBe(0);
    });

    it("no extraMeters", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test House",
        unitPrice: 10,
        rooms: [
          room("r1", { meterType: "separate", readings: [reading(defaultMonth, 0, 50)] }),
        ],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.extraMeters).toHaveLength(0);
      expect(result.mainMeter).toBeNull();
      expect(result.unmeteredUnits).toBe(0);
    });

    it("houseId and houseName are passed through", () => {
      const data: HouseRawData = {
        houseId: "abc-123",
        houseName: "My House",
        unitPrice: 15,
        rooms: [],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      expect(result.houseId).toBe("abc-123");
      expect(result.houseName).toBe("My House");
      expect(result.unitPrice).toBe(15);
    });
  });

  describe("real-world scenario — primary house structure", () => {
    it("matches the Primary House seed layout with realistic readings", () => {
      const data: HouseRawData = {
        houseId: "primary",
        houseName: "Primary House",
        unitPrice: 15,
        rooms: [
          room("r0", { number: 0, name: "", meterType: "unmetered", readings: [] }),
          room("r1", { number: 1, name: "", meterType: "unmetered", readings: [] }),
          room("r2", { number: 2, name: "", meterType: "separate", readings: [reading(defaultMonth, 1200, 1350)] }),
          room("r3", { number: 3, name: "", meterType: "separate", readings: [reading(defaultMonth, 800, 920)] }),
          room("r4", { number: 4, name: "", meterType: "separate", readings: [reading(defaultMonth, 500, 620)] }),
          room("r5", { number: 5, name: "Shutter", meterType: "separate", readings: [reading(defaultMonth, 50, 80)] }),
          room("r6", { number: 6, name: "Avash", meterType: "separate", readings: [reading(defaultMonth, 300, 450)] }),
          room("r7", { number: 7, name: "Maiya", meterType: "shared", groupKey: "p-7-8", readings: [reading(defaultMonth, 1000, 1200)] }),
          room("r8", { number: 8, name: "Sabari", meterType: "shared", groupKey: "p-7-8", readings: [reading(defaultMonth, 1000, 1200)] }),
          room("r9", { number: 9, name: "", meterType: "shared", groupKey: "p-9-10", readings: [reading(defaultMonth, 600, 700)] }),
          room("r10", { number: 10, name: "", meterType: "shared", groupKey: "p-9-10", readings: [reading(defaultMonth, 600, 700)] }),
          room("r11", { number: 11, name: "Manita", meterType: "shared", groupKey: "p-11-12", readings: [reading(defaultMonth, 400, 500)] }),
          room("r12", { number: 12, name: "Manita", meterType: "shared", groupKey: "p-11-12", readings: [reading(defaultMonth, 400, 500)] }),
          room("r13", { number: 13, name: "Manash", meterType: "shared", groupKey: "p-13-14", readings: [reading(defaultMonth, 700, 900)] }),
          room("r14", { number: 14, name: "Manoj", meterType: "shared", groupKey: "p-13-14", readings: [reading(defaultMonth, 700, 900)] }),
          room("r15", { number: 15, name: "Sharmila", meterType: "shared", groupKey: "p-15-16", readings: [reading(defaultMonth, 300, 450)] }),
          room("r16", { number: 16, name: "Sharmila", meterType: "shared", groupKey: "p-15-16", readings: [reading(defaultMonth, 300, 450)] }),
          room("r17", { number: 17, name: "DevMaya", meterType: "unmetered", readings: [] }),
          room("r18", { number: 18, name: "DevMaya", meterType: "unmetered", readings: [] }),
        ],
        extraMeters: [
          { id: "em1", type: "main", label: "Main Meter", readings: [reading(defaultMonth, 5000, 6500)] },
          { id: "em2", type: "khanepani", label: "Khanepani", readings: [reading(defaultMonth, 2000, 2400)] },
          { id: "em3", type: "melamchi", label: "Melamchi", readings: [reading(defaultMonth, 500, 580)] },
        ],
      };

      const result = calculateHouse(data, defaultMonth);

      // --- separate rooms ---
      expect(result.separate).toHaveLength(5);
      // r2: 1350-1200 = 150 * 15 = 2250
      // r3: 920-800 = 120 * 15 = 1800
      // r4: 620-500 = 120 * 15 = 1800
      // r5: 80-50 = 30 * 15 = 450
      // r6: 450-300 = 150 * 15 = 2250
      const separateBills = [2250, 1800, 1800, 450, 2250];
      expect(result.separate.map((r) => r.bill)).toEqual(separateBills);
      const separateUnits = result.separate.reduce((s, r) => s + r.units, 0);
      expect(separateUnits).toBe(570);

      // --- shared groups ---
      expect(result.shared).toHaveLength(5);

      const p78 = result.shared.find((g) => g.groupKey === "p-7-8")!;
      expect(p78.totalUnits).toBe(400);     // 200 + 200
      expect(p78.perRoomUnits).toBe(200);
      expect(p78.perRoomBill).toBe(3000);

      const p910 = result.shared.find((g) => g.groupKey === "p-9-10")!;
      expect(p910.totalUnits).toBe(200);     // 100 + 100
      expect(p910.perRoomUnits).toBe(100);
      expect(p910.perRoomBill).toBe(1500);

      const p1112 = result.shared.find((g) => g.groupKey === "p-11-12")!;
      expect(p1112.totalUnits).toBe(200);     // 100 + 100
      expect(p1112.perRoomUnits).toBe(100);

      const p1314 = result.shared.find((g) => g.groupKey === "p-13-14")!;
      expect(p1314.totalUnits).toBe(400);     // 200 + 200
      expect(p1314.perRoomUnits).toBe(200);

      const p1516 = result.shared.find((g) => g.groupKey === "p-15-16")!;
      expect(p1516.totalUnits).toBe(300);     // 150 + 150
      expect(p1516.perRoomUnits).toBe(150);

      const sharedUnits = result.shared.reduce((s, g) => s + g.totalUnits, 0);
      expect(sharedUnits).toBe(1500);

      // --- main meter ---
      expect(result.mainMeter).not.toBeNull();
      expect(result.mainMeter!.units).toBe(1500);   // 6500 - 5000

      // --- unmetered ---
      // metered = separate(570) + shared(1500) = 2070
      // unmeteredUnits = max(0, 1500 - 2070) = 0 (main is less than metered)
      expect(result.unmetered).toHaveLength(4);
      expect(result.unmeteredUnits).toBe(0);
      expect(result.perUnmeteredUnits).toBe(0);
      expect(result.perUnmeteredBill).toBe(0);
      for (const r of result.unmetered) {
        expect(r.units).toBe(0);
        expect(r.bill).toBe(0);
      }

      // --- total metered ---
      expect(result.totalMeteredUnits).toBe(2070);

      // --- extra meters (khanepani + melamchi, not main) ---
      expect(result.extraMeters).toHaveLength(3);
      const khan = result.extraMeters.find((m) => m.type === "khanepani")!;
      expect(khan.units).toBe(400);
      expect(khan.bill).toBe(6000);
      const mel = result.extraMeters.find((m) => m.type === "melamchi")!;
      expect(mel.units).toBe(80);
      expect(mel.bill).toBe(1200);
      expect(result.extraTotalBill).toBe(7200);

      // --- loss ---
      // mainUnits = 1500, distributed = 2070 + 0 = 2070
      // loss = max(0, 1500 - 2070) = 0
      expect(result.lossFromMain).toBe(0);
      expect(result.lossPercent).toBe(0);

      // --- grand total ---
      const roomBill = result.roomTotalBill;
      const expectedRoomBill = 2250 + 1800 + 1800 + 450 + 2250   // separate
        + 3000 * 2 + 1500 * 2 + 1500 * 2 + 3000 * 2 + 2250 * 2;  // shared groups
      expect(roomBill).toBe(expectedRoomBill);
      expect(result.grandTotal).toBe(roomBill + 7200);
    });
  });

  describe("mixed scenario — separate + shared + unmetered + extra meters", () => {
    it("computes all fields consistently", () => {
      const data: HouseRawData = {
        houseId: "h2",
        houseName: "Mixed House",
        unitPrice: 10,
        rooms: [
          room("s1", { number: 1, name: "Solo", meterType: "separate", readings: [reading(defaultMonth, 10, 40)] }),
          room("g1a", { number: 2, name: "A", meterType: "shared", groupKey: "g1", readings: [reading(defaultMonth, 100, 130)] }),
          room("g1b", { number: 3, name: "B", meterType: "shared", groupKey: "g1", readings: [reading(defaultMonth, 100, 130)] }),
          room("u1", { number: 4, name: "Unmetered 1", meterType: "unmetered" }),
          room("u2", { number: 5, name: "Unmetered 2", meterType: "unmetered" }),
        ],
        extraMeters: [
          { id: "main", type: "main", label: "Main", readings: [reading(defaultMonth, 500, 700)] },
          { id: "wp", type: "khanepani", label: "Water", readings: [reading(defaultMonth, 100, 130)] },
        ],
      };

      const result = calculateHouse(data, defaultMonth);

      // Separate
      expect(result.separate[0].units).toBe(30);
      expect(result.separate[0].bill).toBe(300);

      // Shared group: g1 = 30 + 30 = 60, split equally = 30 each
      expect(result.shared[0].totalUnits).toBe(60);
      expect(result.shared[0].perRoomUnits).toBe(30);
      expect(result.shared[0].rooms[0].bill).toBe(300);

      // Total metered = 30 + 60 = 90
      expect(result.totalMeteredUnits).toBe(90);

      // Main = 200, unmetered = max(0, 200 - 90) = 110, split 2 rooms = 55 each
      expect(result.mainMeter!.units).toBe(200);
      expect(result.unmeteredUnits).toBe(110);
      expect(result.perUnmeteredUnits).toBe(55);
      expect(result.perUnmeteredBill).toBe(550);
      expect(result.unmetered[0].units).toBe(55);
      expect(result.unmetered[1].units).toBe(55);

      // Total units = 90 + 110 = 200
      expect(result.totalUnits).toBe(200);

      // Loss = max(0, 200 - 200) = 0
      expect(result.lossFromMain).toBe(0);
      expect(result.lossPercent).toBe(0);

      // Extra bills (khanepani only, main excluded)
      expect(result.extraTotalBill).toBe(300);

      // Room total bill
      const expectedRoomBill = 300 + (300 * 2) + (550 * 2);
      expect(result.roomTotalBill).toBe(expectedRoomBill);
      expect(result.grandTotal).toBe(expectedRoomBill + 300);
    });
  });

  describe("result structure", () => {
    it("returns all expected top-level keys", () => {
      const data: HouseRawData = {
        houseId: "h1",
        houseName: "Test",
        unitPrice: 10,
        rooms: [],
        extraMeters: [],
      };
      const result = calculateHouse(data, defaultMonth);
      const keys = Object.keys(result).sort();
      expect(keys).toEqual([
        "extraMeters",
        "extraTotalBill",
        "grandTotal",
        "houseId",
        "houseName",
        "lossFromMain",
        "lossPercent",
        "mainMeter",
        "perUnmeteredBill",
        "perUnmeteredUnits",
        "roomTotalBill",
        "separate",
        "shared",
        "totalMeteredUnits",
        "totalUnits",
        "unitPrice",
        "unmetered",
        "unmeteredCount",
        "unmeteredUnits",
      ]);
    });
  });
});
