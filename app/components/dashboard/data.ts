import type { DashboardContent, DashboardPage } from "./types";

export const SIDEBAR_LINKS: readonly DashboardPage[] = [
  "Overview",
  "Analytics",
  "Customers",
  "Reports",
  "Settings",
];

export const DASHBOARD_CONTENT: Record<DashboardPage, DashboardContent> = {
  Overview: {
    heroTitle: "Your business is growing fast.",
    heroDescription:
      "Revenue is up this month and customer retention improved. Focus on checkout completion to keep momentum.",
    monthlyGoal: "$32,000",
    goalProgress: 76,
    trafficSources: [
      { name: "Organic Search", value: 54 },
      { name: "Paid Ads", value: 21 },
      { name: "Social Media", value: 16 },
      { name: "Direct", value: 9 },
    ],
    recentActivity: [
      "New order #4832 received",
      "Marketing campaign reached 10k views",
      "3 new users signed up",
      "Subscription plan upgraded",
    ],
  },
  Analytics: {
    heroTitle: "Performance trends are improving.",
    heroDescription: "Campaign efficiency and conversion quality are both up compared to last period.",
    monthlyGoal: "120k sessions",
    goalProgress: 68,
    trafficSources: [
      { name: "Search", value: 46 },
      { name: "Email", value: 24 },
      { name: "Social", value: 18 },
      { name: "Referral", value: 12 },
    ],
    recentActivity: [
      "Weekly analytics report generated",
      "Top landing page updated",
      "Ad set A/B test completed",
      "Attribution model recalculated",
    ],
  },
  Customers: {
    heroTitle: "Customer health remains strong.",
    heroDescription: "Retention is steady while acquisition keeps growing in the premium segment.",
    monthlyGoal: "6,000 active customers",
    goalProgress: 88,
    trafficSources: [
      { name: "Referrals", value: 38 },
      { name: "Organic", value: 30 },
      { name: "Paid", value: 20 },
      { name: "Partnerships", value: 12 },
    ],
    recentActivity: [
      "42 users upgraded plan",
      "Support CSAT reached 96%",
      "Retention cohort 30D improved",
      "New customer feedback tags added",
    ],
  },
  Reports: {
    heroTitle: "Reporting pipeline is up to date.",
    heroDescription: "All scheduled reports were delivered, and executive summaries are ready for export.",
    monthlyGoal: "40 reports delivered",
    goalProgress: 72,
    trafficSources: [
      { name: "Sales Reports", value: 34 },
      { name: "Finance Reports", value: 27 },
      { name: "Marketing Reports", value: 23 },
      { name: "Ops Reports", value: 16 },
    ],
    recentActivity: [
      "Quarterly report exported",
      "Daily KPI digest sent",
      "Template 'Growth v2' published",
      "Failed job retried successfully",
    ],
  },
  Settings: {
    heroTitle: "Workspace settings are healthy.",
    heroDescription: "Security and configuration checks are mostly complete with just a few recommendations left.",
    monthlyGoal: "100% setup completion",
    goalProgress: 91,
    trafficSources: [
      { name: "Admin Changes", value: 44 },
      { name: "Integrations", value: 26 },
      { name: "Billing", value: 18 },
      { name: "Security", value: 12 },
    ],
    recentActivity: [
      "SSO policy updated",
      "New webhook secret rotated",
      "Audit logging enabled",
      "Billing contact changed",
    ],
  },
};
