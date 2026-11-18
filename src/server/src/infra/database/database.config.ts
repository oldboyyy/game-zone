import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected successfully.");
  } catch (error) {
    throw error;
  }
};

export default prisma;
