import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { meterId, month, previous, current } = body;

    if (!meterId || !month) {
      return NextResponse.json({ error: "meterId and month are required" }, { status: 400 });
    }

    const p = parseFloat(previous) || 0;
    const c = parseFloat(current) || 0;

    const reading = await prisma.extraMeterReading.upsert({
      where: { meterId_month: { meterId, month } },
      update: { previous: p, current: c },
      create: { meterId, month, previous: p, current: c },
    });

    return NextResponse.json(reading);
  } catch {
    return NextResponse.json({ error: "Failed to save meter reading" }, { status: 500 });
  }
}
