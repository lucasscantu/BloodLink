/* eslint-disable no-console */
import "dotenv/config";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function waitForDatabase() {
  console.log("[backend] Aguardando o PostgreSQL aceitar conexões...");
  for (let attempt = 1; attempt <= 60; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("[backend] PostgreSQL disponível.");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("PostgreSQL não respondeu a tempo.");
}

async function main() {
  await waitForDatabase();

  console.log("[backend] Rodando migrations...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });

  const userCount = await prisma.user.count().catch(() => 0);

  if (userCount === 0) {
    console.log(
      "[backend] Banco vazio — executando seed de demonstração " +
        "(registra eventos reais na blockchain, pode levar alguns minutos)..."
    );
    execSync("npx ts-node prisma/seed.ts", { stdio: "inherit" });
  } else {
    console.log(`[backend] Banco já populado (${userCount} usuário(s)), pulando o seed.`);
  }
}

main()
  .catch((err) => {
    console.error("[backend] Erro no bootstrap:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
