import "dotenv/config";
import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Demo content only: every name, e-mail, phone and company below is fictional.
// Required env: DATABASE_URL, SEED_ADMIN_PASSWORD. Optional: SEED_ADMIN_EMAIL, SEED_DEMO_DATA=false.

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const PAGE_METRICS = {
  overview: {
    goalProgress: 76,
    traffic: [["organicSearch", 54], ["paidAds", 21], ["socialMedia", 16], ["direct", 9]],
    activity: ["newOrder", "campaign10k", "newUsers", "planUpgraded"],
    stats: [["revenue", "$24,520", "+12.5%"], ["orders", "1,482", "+8.2%"], ["customers", "5,329", "+4.1%"], ["conversion", "3.74%", "+0.6%"]],
  },
  analytics: {
    goalProgress: 68,
    traffic: [["search", 46], ["email", 24], ["social", 18], ["referral", 12]],
    activity: ["weeklyReport", "landingUpdated", "abTest", "attribution"],
    stats: [["sessions", "82,410", "+9.3%"], ["bounceRate", "32.4%", "-2.1%"], ["avgDuration", "4:12", "+11.7%"], ["ctr", "5.82%", "+0.9%"]],
  },
  customers: {
    goalProgress: 88,
    traffic: [["referrals", 38], ["organic", 30], ["paid", 20], ["partnerships", 12]],
    activity: ["usersUpgraded", "csat", "cohort", "feedbackTags"],
    stats: [["activeUsers", "5,329", "+4.1%"], ["churn", "1.9%", "-0.4%"], ["nps", "62", "+3"], ["ltv", "$1,240", "+6.8%"]],
  },
  reports: {
    goalProgress: 72,
    traffic: [["salesReports", 34], ["financeReports", 27], ["marketingReports", 23], ["opsReports", 16]],
    activity: ["quarterlyExported", "kpiDigest", "templatePublished", "jobRetried"],
    stats: [["generated", "29", "+7"], ["automated", "84%", "+5%"], ["avgBuildTime", "18s", "-3s"], ["deliveryRate", "99.2%", "+0.4%"]],
  },
  settings: {
    goalProgress: 91,
    traffic: [["adminChanges", 44], ["integrations", 26], ["billing", 18], ["security", 12]],
    activity: ["ssoUpdated", "webhookRotated", "auditLogging", "billingContact"],
    stats: [["configured", "91%", "+6%"], ["teamSeats", "18/20", "+2"], ["twoFa", "94%", "+8%"], ["integrations", "12", "+1"]],
  },
} as const;

const CUSTOMERS = [
  ["John Doe", "john.doe@example.com", "Demo Company LLC", "+998 00 000 00 01", "PRO", "ACTIVE", 4820, "2025-11-03"],
  ["Jane Roe", "jane.roe@example.com", "Example Trading Ltd", "+998 00 000 00 02", "BUSINESS", "ACTIVE", 12940, "2025-09-18"],
  ["Richard Roe", "richard.roe@example.com", "Sample Studio", "+998 00 000 00 03", "FREE", "TRIAL", 0, "2026-08-27"],
  ["Mary Major", "mary.major@example.com", "Acme Demo Inc", "+998 00 000 00 04", "PRO", "ACTIVE", 3150, "2026-01-12"],
  ["Alex Sample", "alex.sample@example.com", "Placeholder Group", "+998 00 000 00 05", "BUSINESS", "PAUSED", 8760, "2025-06-30"],
  ["Sam Placeholder", "sam.placeholder@example.com", "Test Market Co", "+998 00 000 00 06", "FREE", "ACTIVE", 240, "2026-05-09"],
  ["Test User", "test.user@example.com", "Example Logistics", "+998 00 000 00 07", "PRO", "TRIAL", 0, "2026-09-30"],
  ["Demo Customer", "demo.customer@example.com", "Demo Retail Ltd", "+998 00 000 00 08", "PRO", "PAUSED", 1980, "2025-12-21"],
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
    await prisma.user.upsert({ where: { email }, update: {}, create: { name, email, role, company: "Demo Company LLC", passwordHash: hash } });
  }
  for (const [page, m] of Object.entries(PAGE_METRICS)) {
    const data = {
      goalProgress: m.goalProgress,
      traffic: m.traffic.map(([key, value]) => ({ key, value })),
      activity: [...m.activity],
      stats: m.stats.map(([key, value, trend]) => ({ key, value, trend })),
    };
    await prisma.pageMetrics.upsert({ where: { page }, update: data, create: { page, ...data } });
  }
  const series = { revenue: [18200, 19800, 21400, 20900, 22800, 24520], sessions: [14100, 11800, 12600, 13900, 12300, 9100, 8610] };
  for (const [key, values] of Object.entries(series)) {
    await prisma.chartSeries.upsert({ where: { key }, update: { values }, create: { key, values } });
  }
  for (const [path, views] of [["/", 18420], ["/pricing", 9310], ["/products/demo-item", 7245], ["/blog/getting-started", 5120], ["/contact", 3388]] as const) {
    await prisma.topPage.upsert({ where: { path }, update: { views }, create: { path, views } });
  }
  for (const [name, email, company, phone, plan, status, spent, joined] of CUSTOMERS) {
    await prisma.customer.upsert({
      where: { email },
      update: {},
      create: { name, email, company, phone, plan, status, spent, joinedAt: new Date(joined) },
    });
  }
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
