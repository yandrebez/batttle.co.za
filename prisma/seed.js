require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@battle.store").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin12345!";
  const adminName = process.env.ADMIN_NAME || "Battle Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: passwordHash,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      name: adminName,
      password: passwordHash,
      role: "ADMIN",
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log("Admin user is ready:", admin);
  console.log("Email:", adminEmail);
  if (!process.env.ADMIN_PASSWORD) {
    console.log("Password (default): Admin12345!");
    console.log("Set ADMIN_PASSWORD in .env to override this default.");
  }
}

main()
  .catch((error) => {
    console.error("Admin seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
