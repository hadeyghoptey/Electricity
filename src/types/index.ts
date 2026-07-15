export interface House {
  id: string;
  name: string;
  slug: string;
  rooms: Room[];
  extraMeters: ExtraMeter[];
}

export interface Room {
  id: string;
  number: number;
  name: string;
  meterType: "separate" | "shared" | "unmetered";
  groupKey: string | null;
  readings: Reading[];
  houseId: string;
}

export interface ExtraMeter {
  id: string;
  type: "main" | "khanepani" | "melamchi";
  label: string;
  readings: ExtraMeterReading[];
  houseId: string;
}

export interface Reading {
  id: string;
  roomId: string;
  month: string;
  previous: number;
  current: number;
}

export interface ExtraMeterReading {
  id: string;
  meterId: string;
  month: string;
  previous: number;
  current: number;
}

export interface Config {
  unitPrice: number;
}

export type ViewTab = "primary" | "secondary";
