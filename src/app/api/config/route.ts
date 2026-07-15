import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.config.findUnique({ where: { id: "global" } });
  return NextResponse.json({ unitPrice: config?.unitPrice ?? 15 });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const unitPrice = parseFloat(body.unitPrice);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      return NextResponse.json({ error: "Invalid unit price" }, { status: 400 });
    }
    const config = await prisma.config.upsert({
      where: { id: "global" },
      update: { unitPrice },
      create: { id: "global", unitPrice },
    });
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
