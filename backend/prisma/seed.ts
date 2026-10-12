import "dotenv/config";
import { randomBytes } from "node:crypto";
import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Demo content only: every name, e-mail, phone and company below is fictional.
// Required env: DATABASE_URL, SEED_ADMIN_PASSWORD. Optional: SEED_ADMIN_EMAIL, SEED_DEMO_DATA=false.

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const CUSTOMERS = [
  ["John Doe", "john.doe@example.com", "Demo Company LLC", "+998 00 000 00 01", "PRO", "ACTIVE", "REFERRALS", "2025-11-03"],
  ["Jane Roe", "jane.roe@example.com", "Example Trading Ltd", "+998 00 000 00 02", "BUSINESS", "ACTIVE", "ORGANIC", "2025-09-18"],
  ["Richard Roe", "richard.roe@example.com", "Sample Studio", "+998 00 000 00 03", "FREE", "TRIAL", "PAID", "2026-09-27"],
  ["Mary Major", "mary.major@example.com", "Acme Demo Inc", "+998 00 000 00 04", "PRO", "ACTIVE", "REFERRALS", "2026-01-12"],
  ["Alex Sample", "alex.sample@example.com", "Placeholder Group", "+998 00 000 00 05", "BUSINESS", "PAUSED", "PARTNERSHIPS", "2025-06-30"],
  ["Sam Placeholder", "sam.placeholder@example.com", "Test Market Co", "+998 00 000 00 06", "FREE", "ACTIVE", "ORGANIC", "2026-05-09"],
  ["Test User", "test.user@example.com", "Example Logistics", "+998 00 000 00 07", "PRO", "TRIAL", "ORGANIC", "2026-10-02"],
  ["Demo Customer", "demo.customer@example.com", "Demo Retail Ltd", "+998 00 000 00 08", "PRO", "PAUSED", "PAID", "2025-12-21"],
] as const;

const REPORTS = [
  ["salesMonthly", "SALES", "READY", 1482, "2026-10-01"],
  ["financeQuarterly", "FINANCE", "READY", 312, "2026-10-01"],
  ["marketingFunnel", "MARKETING", "SCHEDULED", 905, "2026-09-28"],
  ["opsWeekly", "OPS", "READY", 214, "2026-10-06"],
  ["kpiDaily", "SALES", "SCHEDULED", 48, "2026-10-11"],
  ["customersCohort", "MARKETING", "READY", 640, "2026-09-15"],
] as const;

const TEAM = [
  ["Jane Roe", "jane.roe@example.com", "ADMIN"],
  ["Richard Roe", "richard.roe@example.com", "USER"],
  ["Mary Major", "mary.major@example.com", "USER"],
  ["Test User", "test.user@example.com", "USER"],
] as const;

// Small deterministic PRNG so every seed run produces the same demo numbers.
let state = 20261012;
const rand = () => ((state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(items: readonly (readonly [T, number])[]): T => {
  let r = rand() * items.reduce((a, [, w]) => a + w, 0);
  for (const [item, w] of items) if ((r -= w) < 0) return item;
  return items[0][0];
};
const DAY = 86_400_000;

/** Demo orders, website sessions and feed events (only when the tables are empty). */
async function seedTraffic() {
  const now = Date.now();
  if ((await prisma.order.count()) === 0) {
    const customers = await prisma.customer.findMany({ select: { id: true } });
    const orders = [];
    for (let day = 180; day >= 0; day--) {
      const perDay = Math.round(5 + (180 - day) / 25 + rand() * 4); // gentle growth
      for (let i = 0; i < perDay; i++) {
        orders.push({
          amount: 20 + Math.floor(rand() * 160),
          status: pick([["PAID", 92], ["PENDING", 5], ["REFUNDED", 3]] as const),
          customerId: rand() < 0.25 ? customers[Math.floor(rand() * customers.length)].id : null,
          createdAt: new Date(now - day * DAY - Math.floor(rand() * DAY)),
        });
      }
    }
    await prisma.order.createMany({ data: orders });
    await prisma.$executeRaw`UPDATE "Customer" c SET spent = COALESCE((SELECT SUM(o.amount) FROM "Order" o WHERE o."customerId" = c.id AND o.status = 'PAID'), 0)`;
  }
  if ((await prisma.visit.count()) === 0) {
    const visits = [];
    for (let day = 59; day >= 0; day--) {
      const perDay = Math.round(110 + (60 - day) * 1.5 + rand() * 60);
      for (let i = 0; i < perDay; i++) {
        const pageviews = 1 + Math.floor(rand() * rand() * 9);
        visits.push({
          path: pick([["/", 38], ["/pricing", 20], ["/products/demo-item", 16], ["/blog/getting-started", 14], ["/contact", 8], ["/about", 4]] as const),
          source: pick([["SEARCH", 46], ["PAID", 18], ["SOCIAL", 14], ["DIRECT", 12], ["EMAIL", 7], ["REFERRAL", 3]] as const),
          pageviews,
          durationSec: 10 + Math.floor(rand() * 400),
          bounced: pageviews === 1,
          createdAt: new Date(now - day * DAY - Math.floor(rand() * DAY)),
        });
      }
    }
    for (let i = 0; i < visits.length; i += 5000) await prisma.visit.createMany({ data: visits.slice(i, i + 5000) });
  }
  if ((await prisma.activity.count()) === 0) {
    const feed: [string, string, Record<string, string | number> | undefined, number][] = [
      ["orderCreated", "orders", { number: 1, amount: 64 }, 0.2],
      ["customerAdded", "customers", { name: "Test User" }, 1],
      ["reportCreated", "reports", { name: "Monthly sales report" }, 2],
      ["memberInvited", "team", { email: "test.user@example.com" }, 3],
      ["reportExported", "reports", { name: "Quarterly finance summary" }, 4],
      ["login", "security", { name: "John Doe" }, 5],
    ];
    await prisma.activity.createMany({
      data: feed.map(([type, category, params, days]) => ({ type, category, params, createdAt: new Date(now - days * DAY) })),
    });
  }
}

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 8) throw new Error("Set SEED_ADMIN_PASSWORD (min 8 chars) to run the seed");
  const hash = await bcrypt.hash(password, 12);
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "demo@example.com").toLowerCase();

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "John Doe", phone: "+998 00 000 00 00", company: "Demo Company LLC", role: "ADMIN", passwordHash: hash },
  });
  console.log(`Admin user ready: ${adminEmail}`);

  if (process.env.SEED_DEMO_DATA === "false") return;

  for (const [name, email, role] of TEAM) {
    // Demo teammates get a random password nobody knows, so they can't be logged into.
    const unusable = await bcrypt.hash(randomBytes(16).toString("hex"), 12);
    await prisma.user.upsert({ where: { email }, update: {}, create: { name, email, role, company: "Demo Company LLC", phone: "+998 00 000 00 10", passwordHash: unusable } });
  }
  for (const [name, email, company, phone, plan, status, source, joined] of CUSTOMERS) {
    await prisma.customer.upsert({
      where: { email },
      update: {},
      create: { name, email, company, phone, plan, status, source, joinedAt: new Date(joined) },
    });
  }
  await seedTraffic();
  if ((await prisma.report.count()) === 0) {
    await prisma.report.createMany({
      data: REPORTS.map(([nameKey, type, status, rows, createdAt]) => ({ nameKey, type, status, rows, createdAt: new Date(createdAt) })),
    });
  }
  console.log("Demo data seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
