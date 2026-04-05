import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function clearDeals() {
  console.log("削除開始...");

  const notifications = await prisma.notification.deleteMany({});
  console.log(`✓ Notification: ${notifications.count}件削除`);

  const events = await prisma.dealEvent.deleteMany({});
  console.log(`✓ DealEvent: ${events.count}件削除`);

  const payments = await prisma.payment.deleteMany({});
  console.log(`✓ Payment: ${payments.count}件削除`);

  const deals = await prisma.deal.deleteMany({});
  console.log(`✓ Deal: ${deals.count}件削除`);

  console.log("\n完了！メンバーとチーム目標はそのままです。");

  await prisma.$disconnect();
}

clearDeals().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
