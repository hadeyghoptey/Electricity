import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readingSchema } from "@/lib/validations";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsed = readingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { roomId, month, previous, current } = parsed.data;

    const reading = await prisma.reading.upsert({
      where: { roomId_month: { roomId, month } },
      update: { previous, current },
      create: { roomId, month, previous, current },
    });

    return NextResponse.json(reading);
  } catch {
    return NextResponse.json({ error: "Failed to save reading" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.reading.deleteMany();
    await prisma.extraMeterReading.deleteMany();
    return NextResponse.json({ message: "All readings cleared" });
  } catch {
    return NextResponse.json({ error: "Failed to clear readings" }, { status: 500 });
  }
}
