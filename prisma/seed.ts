import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingConfig = await prisma.config.findUnique({ where: { id: "global" } });
  if (!existingConfig) {
    await prisma.config.create({ data: { id: "global", unitPrice: 15 } });
  }

  const existingPrimary = await prisma.house.findUnique({ where: { slug: "primary" } });
  if (existingPrimary) {
    console.log("Database already seeded. Run `prisma migrate reset --force` to re-seed.");
    return;
  }

  // ===== PRIMARY HOUSE =====
  const primary = await prisma.house.create({
    data: { name: "Primary House", slug: "primary" },
  });

  const primaryRooms = [
    { number: 0, name: "", meterType: "unmetered", groupKey: "" },
    { number: 1, name: "", meterType: "unmetered", groupKey: "" },
    { number: 2, name: "", meterType: "separate", groupKey: "" },
    { number: 3, name: "", meterType: "separate", groupKey: "" },
    { number: 4, name: "", meterType: "separate", groupKey: "" },
    { number: 5, name: "Shutter", meterType: "separate", groupKey: "" },
    { number: 6, name: "Avash", meterType: "separate", groupKey: "" },
    { number: 7, name: "Maiya", meterType: "shared", groupKey: "p-7-8" },
    { number: 8, name: "Sabari", meterType: "shared", groupKey: "p-7-8" },
    { number: 9, name: "", meterType: "shared", groupKey: "p-9-10" },
    { number: 10, name: "", meterType: "shared", groupKey: "p-9-10" },
    { number: 11, name: "Manita", meterType: "shared", groupKey: "p-11-12" },
    { number: 12, name: "Manita", meterType: "shared", groupKey: "p-11-12" },
    { number: 13, name: "Manash", meterType: "shared", groupKey: "p-13-14" },
    { number: 14, name: "Manoj", meterType: "shared", groupKey: "p-13-14" },
    { number: 15, name: "Sharmila", meterType: "shared", groupKey: "p-15-16" },
    { number: 16, name: "Sharmila", meterType: "shared", groupKey: "p-15-16" },
    { number: 17, name: "DevMaya", meterType: "unmetered", groupKey: "" },
    { number: 18, name: "DevMaya", meterType: "unmetered", groupKey: "" },
  ];

  for (const rd of primaryRooms) {
    await prisma.room.create({
      data: { ...rd, houseId: primary.id },
    });
  }

  for (const em of ["main", "khanepani", "melamchi"]) {
    await prisma.extraMeter.create({
      data: {
        type: em,
        label: em === "main" ? "Main Meter" : em === "khanepani" ? "Khanepani" : "Melamchi",
        houseId: primary.id,
      },
    });
  }

  // ===== SECONDARY HOUSE =====
  const secondary = await prisma.house.create({
    data: { name: "Secondary House", slug: "secondary" },
  });

  const secondaryRooms = [
    { number: 1, name: "Suman", meterType: "separate", groupKey: "" },
    { number: 2, name: "Sangita Sunuwar", meterType: "shared", groupKey: "s-2-3" },
    { number: 3, name: "Sangita Sunuwar", meterType: "shared", groupKey: "s-2-3" },
    { number: 4, name: "Harimaya", meterType: "separate", groupKey: "" },
    { number: 5, name: "Keshab Magar", meterType: "separate", groupKey: "" },
    { number: 6, name: "Abhisek", meterType: "separate", groupKey: "" },
    { number: 7, name: "Januka", meterType: "separate", groupKey: "" },
    { number: 8, name: "Purna", meterType: "separate", groupKey: "" },
    { number: 9, name: "Purna", meterType: "separate", groupKey: "" },
    { number: 10, name: "Naya Bhai", meterType: "shared", groupKey: "s-10-11" },
    { number: 11, name: "Naya Bhai", meterType: "shared", groupKey: "s-10-11" },
    { number: 12, name: "Satyam", meterType: "shared", groupKey: "s-12-13" },
    { number: 13, name: "Satyam", meterType: "shared", groupKey: "s-12-13" },
    { number: 14, name: "Satyam", meterType: "separate", groupKey: "" },
    { number: 15, name: "Janita", meterType: "shared", groupKey: "s-15-16" },
    { number: 16, name: "Janita", meterType: "shared", groupKey: "s-15-16" },
    { number: 17, name: "Niru", meterType: "shared", groupKey: "s-17-18" },
    { number: 18, name: "Niru", meterType: "shared", groupKey: "s-17-18" },
  ];

  for (const rd of secondaryRooms) {
    await prisma.room.create({
      data: { ...rd, houseId: secondary.id },
    });
  }

  for (const em of ["main", "khanepani", "melamchi"]) {
    await prisma.extraMeter.create({
      data: {
        type: em,
        label: em === "main" ? "Main Meter" : em === "khanepani" ? "Khanepani" : "Melamchi",
        houseId: secondary.id,
      },
    });
  }

  console.log("Database seeded successfully!");
  console.log(`  Primary House: ${primaryRooms.length} rooms`);
  console.log(`  Secondary House: ${secondaryRooms.length} rooms`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
