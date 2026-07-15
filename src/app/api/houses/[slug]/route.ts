import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const house = await prisma.house.findUnique({
    where: { slug },
    include: {
      rooms: {
        orderBy: { number: "asc" },
        include: {
          readings: { orderBy: { month: "desc" }, take: 12 },
        },
      },
      extraMeters: {
        include: {
          readings: { orderBy: { month: "desc" }, take: 12 },
        },
      },
    },
  });

  if (!house) {
    return NextResponse.json({ error: "House not found" }, { status: 404 });
  }

  return NextResponse.json(house);
}
