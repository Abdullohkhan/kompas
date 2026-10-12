import type { Dictionary } from "../i18n";

export type PageId = "overview" | "analytics" | "customers" | "reports" | "settings";

export type TrafficKey = keyof Dictionary["traffic"];
export type ActivityKey = keyof Dictionary["activity"];
export type StatKey = keyof Dictionary["stats"];
export type ReportNameKey = keyof Dictionary["reports"]["names"];
export type ReportType = keyof Dictionary["reports"]["types"];
export type ReportStatus = keyof Dictionary["reports"]["status"];
export type PlanKey = keyof Dictionary["customers"]["plan"];
export type CustomerStatus = keyof Dictionary["customers"]["status"];
export type Role = keyof Dictionary["team"]["role"];

export type Stat = { key: StatKey; value: string; trend: string };
export type TrafficSource = { key: TrafficKey; value: number };

export type PageData = {
  goalProgress: number;
  traffic: TrafficSource[];
  activity: ActivityKey[];
  stats: Stat[];
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
  /** Built-in demo reports use a translated name key; user-created ones carry a custom name. */
  nameKey?: ReportNameKey;
  customName?: string;
  type: ReportType;
  status: ReportStatus;
  createdAt: string; // ISO date
  rows: number;
};

export type TeamMember = { id: string; name: string; email: string; role: Role };
export type TopPage = { path: string; views: number };
