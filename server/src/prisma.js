import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

export async function testDb() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (e) {
    console.error("DB connection failed:", e);
    return false;
  }
}
