import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { roomId, name, meterType } = body;

    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    const data: Record<string, string> = {};
    if (name !== undefined) data.name = name;
    if (meterType !== undefined) data.meterType = meterType;

    const room = await prisma.room.update({
      where: { id: roomId },
      data,
    });

    return NextResponse.json(room);
  } catch {
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}
