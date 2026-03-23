export type Stat = {
  label: string;
  value: string;
  trend: string;
  hint: string;
};

export type TrafficSource = {
  name: string;
  value: number;
};

export type DashboardPage = "Overview" | "Analytics" | "Customers" | "Reports" | "Settings";

export type DashboardContent = {
  heroTitle: string;
  heroDescription: string;
  monthlyGoal: string;
  goalProgress: number;
  trafficSources: TrafficSource[];
  recentActivity: string[];
};
