import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "admin@labgear.local" },
    update: {},
    create: {
      email: "admin@labgear.local",
      passwordHash,
      fullName: "Admin",
      role: "ADMIN",
    },
  });

  await prisma.item.createMany({
    data: [
      {
        name: "Dell Latitude 7420",
        code: "LAP-001",
        category: "Laptop",
        conditionNote: "Excellent",
      },
      {
        name: "Canon EOS M50",
        code: "CAM-003",
        category: "Camera",
        conditionNote: "15-45mm lens",
      },
    ],
    skipDuplicates: true,
  });
}

main().finally(() => prisma.$disconnect());
