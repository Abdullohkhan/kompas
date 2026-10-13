import type { Dictionary } from "../i18n";

export type PageId = "overview" | "analytics" | "customers" | "reports" | "settings";
export const PAGE_IDS: readonly PageId[] = ["overview", "analytics", "customers", "reports", "settings"];
export const pageHref = (page: PageId) => (page === "overview" ? "/" : `/${page}`);

export type TrafficKey = keyof Dictionary["traffic"];
export type StatKey = keyof Dictionary["stats"];
export type ReportNameKey = keyof Dictionary["reports"]["names"];
export type ReportType = keyof Dictionary["reports"]["types"];
export type ReportStatus = keyof Dictionary["reports"]["status"];
export type PlanKey = keyof Dictionary["customers"]["plan"];
export type CustomerStatus = keyof Dictionary["customers"]["status"];
export type CustomerSource = "referrals" | "organic" | "paid" | "partnerships";
export type Role = "admin" | "user";

export type Stat = { key: StatKey; value: string; trend: string | null };
export type TrafficSource = { key: TrafficKey; value: number };
export type ActivityEvent = { id: string; type: string; params: Record<string, string | number> | null; createdAt: string };
export type Insight = { type: string; params: Record<string, string | number> };
export type GoalKind = "revenue" | "sessions" | "customers" | "reports" | "seats";

export type PageData = {
  goal: { kind: GoalKind; current: number; target: number; progress: number };
  traffic: TrafficSource[];
  activity: ActivityEvent[];
  stats: Stat[];
  insights: Insight[];
};

export type Charts = {
  revenueByMonth: { month: number; value: number }[];
  sessionsByDay: { weekday: number; value: number }[];
  topPages: { path: string; views: number }[];
};

export type BillingStatus = {
  configured: boolean;
  plan: "free" | "pro";
  viaSubscription: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  role: Role;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  plan: PlanKey;
  status: CustomerStatus;
  spent: number;
  joined: string; // ISO date
};

export type Report = {
  id: string;
  /** Built-in reports carry a translation key; user-created ones a custom name. */
  nameKey?: ReportNameKey;
  customName?: string;
  type: ReportType;
  status: ReportStatus;
  createdAt: string; // ISO date
  rows: number;
};

export type TeamMember = { id: string; name: string; email: string; role: Role };
