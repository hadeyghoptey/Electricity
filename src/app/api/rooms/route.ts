import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { roomUpdateSchema } from "@/lib/validations";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsed = roomUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { roomId, name, meterType } = parsed.data;
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
