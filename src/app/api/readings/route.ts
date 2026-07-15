import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { roomId, month, previous, current } = body;

    if (!roomId || !month) {
      return NextResponse.json({ error: "roomId and month are required" }, { status: 400 });
    }

    const p = parseFloat(previous) || 0;
    const c = parseFloat(current) || 0;

    const reading = await prisma.reading.upsert({
      where: { roomId_month: { roomId, month } },
      update: { previous: p, current: c },
      create: { roomId, month, previous: p, current: c },
    });

    return NextResponse.json(reading);
  } catch {
    return NextResponse.json({ error: "Failed to save reading" }, { status: 500 });
  }
}
