import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { configUpdateSchema } from "@/lib/validations";

export async function GET() {
  const config = await prisma.config.findUnique({ where: { id: "global" } });
  return NextResponse.json({ unitPrice: config?.unitPrice ?? 15 });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsed = configUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const config = await prisma.config.upsert({
      where: { id: "global" },
      update: { unitPrice: parsed.data.unitPrice },
      create: { id: "global", unitPrice: parsed.data.unitPrice },
    });
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
