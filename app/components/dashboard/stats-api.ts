import type { DashboardPage, Stat } from "./types";

const STATS_BY_PAGE: Record<DashboardPage, Stat[]> = {
  Overview: [
    { label: "Revenue", value: "$24,520", trend: "+12.5%", hint: "vs last month" },
    { label: "Orders", value: "1,482", trend: "+8.2%", hint: "new purchases" },
    { label: "Customers", value: "5,329", trend: "+4.1%", hint: "active users" },
    { label: "Conversion", value: "3.74%", trend: "+0.6%", hint: "checkout rate" },
  ],
  Analytics: [
    { label: "Sessions", value: "82,410", trend: "+9.3%", hint: "total visits" },
    { label: "Bounce Rate", value: "32.4%", trend: "-2.1%", hint: "better engagement" },
    { label: "Avg Duration", value: "4m 12s", trend: "+11.7%", hint: "on-site time" },
    { label: "CTR", value: "5.82%", trend: "+0.9%", hint: "ad performance" },
  ],
  Customers: [
    { label: "Active Users", value: "5,329", trend: "+4.1%", hint: "monthly active" },
    { label: "Churn", value: "1.9%", trend: "-0.4%", hint: "lower is better" },
    { label: "NPS", value: "62", trend: "+3", hint: "customer sentiment" },
    { label: "LTV", value: "$1,240", trend: "+6.8%", hint: "per customer" },
  ],
  Reports: [
    { label: "Generated", value: "29", trend: "+7", hint: "this month" },
    { label: "Automated", value: "84%", trend: "+5%", hint: "workflow coverage" },
    { label: "Avg Build Time", value: "18s", trend: "-3s", hint: "faster generation" },
    { label: "Delivery Rate", value: "99.2%", trend: "+0.4%", hint: "successful sends" },
  ],
  Settings: [
    { label: "Configured", value: "91%", trend: "+6%", hint: "setup progress" },
    { label: "Team Seats", value: "18/20", trend: "+2", hint: "active seats" },
    { label: "2FA Enabled", value: "94%", trend: "+8%", hint: "security score" },
    { label: "Integrations", value: "12", trend: "+1", hint: "connected tools" },
  ],
};

export async function fetchStatsByPage(page: DashboardPage): Promise<Stat[]> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(STATS_BY_PAGE[page]);
    }, 550);
  });
}
