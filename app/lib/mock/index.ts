// All demo data lives here. Every name, e-mail, phone and company is fictional.
// Replace these exports with real API calls when a backend exists.
import type {
  Customer,
  PageData,
  PageId,
  Report,
  TeamMember,
  TopPage,
} from "./types";

export type * from "./types";

export const PAGE_IDS: readonly PageId[] = [
  "overview",
  "analytics",
  "customers",
  "reports",
  "settings",
];

export const DEMO_USER = {
  name: "John Doe",
  firstName: "John",
  initials: "JD",
  email: "demo@example.com",
  phone: "+998 00 000 00 00",
  company: "Demo Company LLC",
};

export const PAGE_DATA: Record<PageId, PageData> = {
  overview: {
    goalProgress: 76,
    traffic: [
      { key: "organicSearch", value: 54 },
      { key: "paidAds", value: 21 },
      { key: "socialMedia", value: 16 },
      { key: "direct", value: 9 },
    ],
    activity: ["newOrder", "campaign10k", "newUsers", "planUpgraded"],
    stats: [
      { key: "revenue", value: "$24,520", trend: "+12.5%" },
      { key: "orders", value: "1,482", trend: "+8.2%" },
      { key: "customers", value: "5,329", trend: "+4.1%" },
      { key: "conversion", value: "3.74%", trend: "+0.6%" },
    ],
  },
  analytics: {
    goalProgress: 68,
    traffic: [
      { key: "search", value: 46 },
      { key: "email", value: 24 },
      { key: "social", value: 18 },
      { key: "referral", value: 12 },
    ],
    activity: ["weeklyReport", "landingUpdated", "abTest", "attribution"],
    stats: [
      { key: "sessions", value: "82,410", trend: "+9.3%" },
      { key: "bounceRate", value: "32.4%", trend: "-2.1%" },
      { key: "avgDuration", value: "4:12", trend: "+11.7%" },
      { key: "ctr", value: "5.82%", trend: "+0.9%" },
    ],
  },
  customers: {
    goalProgress: 88,
    traffic: [
      { key: "referrals", value: 38 },
      { key: "organic", value: 30 },
      { key: "paid", value: 20 },
      { key: "partnerships", value: 12 },
    ],
    activity: ["usersUpgraded", "csat", "cohort", "feedbackTags"],
    stats: [
      { key: "activeUsers", value: "5,329", trend: "+4.1%" },
      { key: "churn", value: "1.9%", trend: "-0.4%" },
      { key: "nps", value: "62", trend: "+3" },
      { key: "ltv", value: "$1,240", trend: "+6.8%" },
    ],
  },
  reports: {
    goalProgress: 72,
    traffic: [
      { key: "salesReports", value: 34 },
      { key: "financeReports", value: 27 },
      { key: "marketingReports", value: 23 },
      { key: "opsReports", value: 16 },
    ],
    activity: ["quarterlyExported", "kpiDigest", "templatePublished", "jobRetried"],
    stats: [
      { key: "generated", value: "29", trend: "+7" },
      { key: "automated", value: "84%", trend: "+5%" },
      { key: "avgBuildTime", value: "18s", trend: "-3s" },
      { key: "deliveryRate", value: "99.2%", trend: "+0.4%" },
    ],
  },
  settings: {
    goalProgress: 91,
    traffic: [
      { key: "adminChanges", value: 44 },
      { key: "integrations", value: 26 },
      { key: "billing", value: 18 },
      { key: "security", value: 12 },
    ],
    activity: ["ssoUpdated", "webhookRotated", "auditLogging", "billingContact"],
    stats: [
      { key: "configured", value: "91%", trend: "+6%" },
      { key: "teamSeats", value: "18/20", trend: "+2" },
      { key: "twoFa", value: "94%", trend: "+8%" },
      { key: "integrations", value: "12", trend: "+1" },
    ],
  },
};

export const REVENUE_BY_MONTH = [18200, 19800, 21400, 20900, 22800, 24520];
export const SESSIONS_BY_WEEKDAY = [14100, 11800, 12600, 13900, 12300, 9100, 8610];

export const TOP_PAGES: TopPage[] = [
  { path: "/", views: 18420 },
  { path: "/pricing", views: 9310 },
  { path: "/products/demo-item", views: 7245 },
  { path: "/blog/getting-started", views: 5120 },
  { path: "/contact", views: 3388 },
];

export const CUSTOMERS: Customer[] = [
  { id: "c1", name: "John Doe", email: "john.doe@example.com", company: "Demo Company LLC", phone: "+998 00 000 00 01", plan: "pro", status: "active", spent: 4820, joined: "2025-11-03" },
  { id: "c2", name: "Jane Roe", email: "jane.roe@example.com", company: "Example Trading Ltd", phone: "+998 00 000 00 02", plan: "business", status: "active", spent: 12940, joined: "2025-09-18" },
  { id: "c3", name: "Richard Roe", email: "richard.roe@example.com", company: "Sample Studio", phone: "+998 00 000 00 03", plan: "free", status: "trial", spent: 0, joined: "2026-08-27" },
  { id: "c4", name: "Mary Major", email: "mary.major@example.com", company: "Acme Demo Inc", phone: "+998 00 000 00 04", plan: "pro", status: "active", spent: 3150, joined: "2026-01-12" },
  { id: "c5", name: "Alex Sample", email: "alex.sample@example.com", company: "Placeholder Group", phone: "+998 00 000 00 05", plan: "business", status: "paused", spent: 8760, joined: "2025-06-30" },
  { id: "c6", name: "Sam Placeholder", email: "sam.placeholder@example.com", company: "Test Market Co", phone: "+998 00 000 00 06", plan: "free", status: "active", spent: 240, joined: "2026-05-09" },
  { id: "c7", name: "Test User", email: "test.user@example.com", company: "Example Logistics", phone: "+998 00 000 00 07", plan: "pro", status: "trial", spent: 0, joined: "2026-09-30" },
  { id: "c8", name: "Demo Customer", email: "demo.customer@example.com", company: "Demo Retail Ltd", phone: "+998 00 000 00 08", plan: "pro", status: "paused", spent: 1980, joined: "2025-12-21" },
];

export const INITIAL_REPORTS: Report[] = [
  { id: "r1", nameKey: "salesMonthly", type: "sales", status: "ready", createdAt: "2026-10-01", rows: 1482 },
  { id: "r2", nameKey: "financeQuarterly", type: "finance", status: "ready", createdAt: "2026-10-01", rows: 312 },
  { id: "r3", nameKey: "marketingFunnel", type: "marketing", status: "scheduled", createdAt: "2026-09-28", rows: 905 },
  { id: "r4", nameKey: "opsWeekly", type: "ops", status: "ready", createdAt: "2026-10-06", rows: 214 },
  { id: "r5", nameKey: "kpiDaily", type: "sales", status: "scheduled", createdAt: "2026-10-11", rows: 48 },
  { id: "r6", nameKey: "customersCohort", type: "marketing", status: "ready", createdAt: "2026-09-15", rows: 640 },
];

export const TEAM: TeamMember[] = [
  { id: "t1", name: "John Doe", email: "john.doe@example.com", role: "owner" },
  { id: "t2", name: "Jane Roe", email: "jane.roe@example.com", role: "admin" },
  { id: "t3", name: "Richard Roe", email: "richard.roe@example.com", role: "analyst" },
  { id: "t4", name: "Mary Major", email: "mary.major@example.com", role: "analyst" },
  { id: "t5", name: "Test User", email: "test.user@example.com", role: "viewer" },
];

/** Simulated network latency so loading skeletons are visible. */
export function fetchPageData(page: PageId): Promise<PageData> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(PAGE_DATA[page]), 350);
  });
}
