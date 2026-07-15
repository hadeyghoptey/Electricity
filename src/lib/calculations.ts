export interface RoomCalcResult {
  roomId: string;
  number: number;
  name: string;
  meterType: string;
  previous: number;
  current: number;
  units: number;
  bill: number;
  groupKey: string | null;
  splitWith: number[];
}

export interface SharedGroupCalcResult {
  groupKey: string;
  label: string;
  previous: number;
  current: number;
  totalUnits: number;
  totalBill: number;
  perRoomUnits: number;
  perRoomBill: number;
  rooms: RoomCalcResult[];
}

export interface ExtraMeterCalcResult {
  id: string;
  type: string;
  label: string;
  previous: number;
  current: number;
  units: number;
  bill: number;
}

export interface HouseCalcResult {
  houseId: string;
  houseName: string;
  unitPrice: number;
  separate: RoomCalcResult[];
  shared: SharedGroupCalcResult[];
  unmetered: RoomCalcResult[];
  extraMeters: ExtraMeterCalcResult[];
  mainMeter: ExtraMeterCalcResult | null;
  roomTotalBill: number;
  extraTotalBill: number;
  grandTotal: number;
  totalUnits: number;
  totalMeteredUnits: number;
  unmeteredUnits: number;
  unmeteredCount: number;
  perUnmeteredUnits: number;
  perUnmeteredBill: number;
  lossFromMain: number;
  lossPercent: number;
}

export interface HouseRawData {
  houseId: string;
  houseName: string;
  unitPrice: number;
  rooms: Array<{
    id: string;
    number: number;
    name: string;
    meterType: string;
    groupKey: string | null;
    readings: Array<{ month: string; previous: number; current: number }>;
  }>;
  extraMeters: Array<{
    id: string;
    type: string;
    label: string;
    readings: Array<{ month: string; previous: number; current: number }>;
  }>;
}

function getLatestReading(
  readings: Array<{ month: string; previous: number; current: number }>,
  month: string
): { previous: number; current: number } {
  const r = readings.find((r) => r.month === month);
  if (r) return { previous: r.previous, current: r.current };
  const sorted = [...readings].sort((a, b) => b.month.localeCompare(a.month));
  if (sorted.length > 0) return { previous: sorted[0].current, current: 0 };
  return { previous: 0, current: 0 };
}

export function calculateHouse(data: HouseRawData, month: string): HouseCalcResult {
  const unitPrice = data.unitPrice;

  const separate: RoomCalcResult[] = [];
  const sharedRooms: RoomCalcResult[] = [];
  const unmetered: RoomCalcResult[] = [];

  const sharedRoomMap = new Map<string, RoomCalcResult[]>();

  for (const room of data.rooms) {
    const reading = getLatestReading(room.readings, month);
    const units = Math.max(0, reading.current - reading.previous);
    const bill = units * unitPrice;

    const result: RoomCalcResult = {
      roomId: room.id,
      number: room.number,
      name: room.name,
      meterType: room.meterType,
      previous: reading.previous,
      current: reading.current,
      units,
      bill,
      groupKey: room.groupKey ?? null,
      splitWith: [],
    };

    if (room.meterType === "separate") {
      separate.push(result);
    } else if (room.meterType === "shared") {
      sharedRooms.push(result);
      const gk = room.groupKey || "ungrouped";
      if (!sharedRoomMap.has(gk)) sharedRoomMap.set(gk, []);
      sharedRoomMap.get(gk)!.push(result);
    } else if (room.meterType === "unmetered") {
      unmetered.push(result);
    }
  }

  const groupLabels: Record<string, string> = {
    "p-7-8": "Maiya & Sabari (7-8)",
    "p-9-10": "Room 9-10",
    "p-11-12": "Manita (11-12)",
    "p-13-14": "Manash-Manoj (13-14)",
    "p-15-16": "Sharmila (15-16)",
    "s-2-3": "Sangita Sunuwar (2-3)",
    "s-10-11": "Naya Bhai (10-11)",
    "s-12-13": "Satyam (12-13)",
    "s-15-16": "Janita (15-16)",
    "s-17-18": "Niru (17-18)",
  };

  // Calculate shared groups
  const shared: SharedGroupCalcResult[] = [];
  for (const [gk, rooms] of sharedRoomMap) {
    const totalUnits = rooms.reduce((sum, r) => sum + r.units, 0);
    const totalBill = totalUnits * unitPrice;
    const roomCount = rooms.length;
    const perRoomUnits = roomCount > 0 ? totalUnits / roomCount : 0;
    const perRoomBill = roomCount > 0 ? totalBill / roomCount : 0;

    for (const r of rooms) {
      r.units = perRoomUnits;
      r.bill = perRoomBill;
      r.splitWith = rooms.filter((or) => or.roomId !== r.roomId).map((or) => or.number);
    }

    shared.push({
      groupKey: gk,
      label: groupLabels[gk] || `Group ${gk}`,
      previous: rooms[0]?.previous ?? 0,
      current: rooms[0]?.current ?? 0,
      totalUnits,
      totalBill,
      perRoomUnits,
      perRoomBill,
      rooms,
    });
  }

  // Extra meters
  const extraMeters: ExtraMeterCalcResult[] = [];
  for (const meter of data.extraMeters) {
    const reading = getLatestReading(meter.readings, month);
    const units = Math.max(0, reading.current - reading.previous);
    extraMeters.push({
      id: meter.id,
      type: meter.type,
      label: meter.label,
      previous: reading.previous,
      current: reading.current,
      units,
      bill: units * unitPrice,
    });
  }

  const mainMeter = extraMeters.find((m) => m.type === "main") ?? null;

  // Calculate unmetered room consumption
  const totalMeteredUnits = separate.reduce((s, r) => s + r.units, 0) +
    shared.reduce((s, g) => s + g.totalUnits, 0);

  const mainUnits = mainMeter?.units ?? 0;
  const unmeteredUnits = Math.max(0, mainUnits - totalMeteredUnits);
  const unmeteredCount = unmetered.length;
  const perUnmeteredUnits = unmeteredCount > 0 ? unmeteredUnits / unmeteredCount : 0;
  const perUnmeteredBill = perUnmeteredUnits * unitPrice;

  for (const r of unmetered) {
    r.units = perUnmeteredUnits;
    r.bill = perUnmeteredBill;
  }

  // Totals
  const roomTotalBill = separate.reduce((s, r) => s + r.bill, 0) +
    shared.reduce((s, g) => s + g.totalBill, 0) +
    unmetered.reduce((s, r) => s + r.bill, 0);

  const extraTotalBill = extraMeters
    .filter((m) => m.type !== "main")
    .reduce((s, m) => s + m.bill, 0);

  const distributedUnits = totalMeteredUnits + unmeteredUnits;
  const lossFromMain = Math.max(0, mainUnits - distributedUnits);
  const lossPercent = mainUnits > 0 ? (lossFromMain / mainUnits) * 100 : 0;

  return {
    houseId: data.houseId,
    houseName: data.houseName,
    unitPrice,
    separate,
    shared,
    unmetered,
    extraMeters,
    mainMeter,
    roomTotalBill,
    extraTotalBill,
    grandTotal: roomTotalBill + extraTotalBill,
    totalUnits: distributedUnits,
    totalMeteredUnits,
    unmeteredUnits,
    unmeteredCount,
    perUnmeteredUnits,
    perUnmeteredBill,
    lossFromMain,
    lossPercent,
  };
}
