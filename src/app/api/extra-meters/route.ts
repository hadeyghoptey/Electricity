import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extraMeterReadingSchema } from "@/lib/validations";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsed = extraMeterReadingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { meterId, month, previous, current } = parsed.data;

    const reading = await prisma.extraMeterReading.upsert({
      where: { meterId_month: { meterId, month } },
      update: { previous, current },
      create: { meterId, month, previous, current },
    });

    return NextResponse.json(reading);
  } catch {
    return NextResponse.json({ error: "Failed to save meter reading" }, { status: 500 });
  }
}
