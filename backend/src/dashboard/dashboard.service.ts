import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PlanService } from "../common/plan.service";

export type PageId = "overview" | "analytics" | "customers" | "reports" | "settings";
type Stat = { key: string; value: string; trend: string | null };
type Insight = { type: string; params: Record<string, string | number> };
type GoalKind = "revenue" | "sessions" | "customers" | "reports" | "seats";

const DAY = 86_400_000;
const GOAL_DEFAULTS: Record<GoalKind, number> = { revenue: 50000, sessions: 12000, customers: 12, reports: 10, seats: 20 };
const GOAL_BY_PAGE: Record<PageId, GoalKind> = { overview: "revenue", analytics: "sessions", customers: "customers", reports: "reports", settings: "seats" };
const FEED_CATEGORIES: Record<PageId, string[] | undefined> = {
  overview: undefined,
  analytics: ["orders", "reports"],
  customers: ["customers", "orders"],
  reports: ["reports"],
  settings: ["team", "billing", "security"],
};
const SOURCE_KEY = { SEARCH: "search", PAID: "paidAds", SOCIAL: "social", DIRECT: "direct", EMAIL: "email", REFERRAL: "referral" } as const;
const CUSTOMER_SOURCE_KEY = { REFERRALS: "referrals", ORGANIC: "organic", PAID: "paid", PARTNERSHIPS: "partnerships" } as const;
const REPORT_TYPE_KEY = { SALES: "salesReports", FINANCE: "financeReports", MARKETING: "marketingReports", OPS: "opsReports" } as const;

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const num = (n: number) => Math.round(n).toLocaleString("en-US");
const pctText = (n: number) => `${n.toFixed(1)}%`;
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
/** Relative change vs the previous period; null when there is nothing to compare with. */
const change = (cur: number, prev: number) => (prev > 0 ? `${cur >= prev ? "+" : ""}${(((cur - prev) / prev) * 100).toFixed(1)}%` : null);
const delta = (n: number) => (n === 0 ? null : `${n > 0 ? "+" : ""}${n}`);
const shares = <K extends string>(rows: { key: K; count: number }[]) => {
  const total = rows.reduce((a, r) => a + r.count, 0);
  if (!total) return [];
  return rows
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((r) => ({ key: r.key, value: Math.round((r.count / total) * 100) }));
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlanService,
  ) {}

  private async goalTarget(kind: GoalKind) {
    const row = await this.prisma.setting.findUnique({ where: { key: `goal.${kind}` } });
    return row?.value ?? GOAL_DEFAULTS[kind];
  }

  async setGoal(kind: GoalKind, value: number) {
    await this.prisma.setting.upsert({ where: { key: `goal.${kind}` }, update: { value }, create: { key: `goal.${kind}`, value } });
  }

  private async sessionStats(from: Date, to: Date) {
    const where = { createdAt: { gte: from, lt: to } };
    const [agg, bounced] = await Promise.all([
      this.prisma.visit.aggregate({ where, _count: true, _avg: { durationSec: true, pageviews: true } }),
      this.prisma.visit.count({ where: { ...where, bounced: true } }),
    ]);
    return {
      sessions: agg._count,
      bounceRate: agg._count ? (bounced / agg._count) * 100 : 0,
      avgDuration: agg._avg.durationSec ?? 0,
      pagesPerSession: agg._avg.pageviews ?? 0,
    };
  }

  private async paidRevenue(from: Date, to: Date) {
    const r = await this.prisma.order.aggregate({ where: { status: "PAID", createdAt: { gte: from, lt: to } }, _sum: { amount: true }, _count: true });
    return { revenue: r._sum.amount ?? 0, orders: r._count };
  }

  private async trafficBreakdown(page: PageId, since: Date) {
    if (page === "customers") {
      const g = await this.prisma.customer.groupBy({ by: ["source"], _count: true });
      return shares(g.map((x) => ({ key: CUSTOMER_SOURCE_KEY[x.source], count: x._count })));
    }
    if (page === "reports") {
      const g = await this.prisma.report.groupBy({ by: ["type"], _count: true });
      return shares(g.map((x) => ({ key: REPORT_TYPE_KEY[x.type], count: x._count })));
    }
    if (page === "settings") {
      const g = await this.prisma.activity.groupBy({ by: ["category"], where: { createdAt: { gte: since } }, _count: true });
      const key = { team: "adminChanges", billing: "billing", security: "security" } as const;
      return shares(g.filter((x) => x.category in key).map((x) => ({ key: key[x.category as keyof typeof key], count: x._count })));
    }
    const g = await this.prisma.visit.groupBy({ by: ["source"], where: { createdAt: { gte: since } }, _count: true });
    return shares(g.map((x) => ({ key: SOURCE_KEY[x.source], count: x._count })));
  }

  async page(page: PageId, user: { id: string; role: string }) {
    const now = new Date();
    const d30 = new Date(+now - 30 * DAY);
    const d60 = new Date(+now - 60 * DAY);
    const kind = GOAL_BY_PAGE[page];
    const [target, traffic, feed] = await Promise.all([
      this.goalTarget(kind),
      this.trafficBreakdown(page, d30),
      this.prisma.activity.findMany({
        where: FEED_CATEGORIES[page] ? { category: { in: FEED_CATEGORIES[page] } } : undefined,
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, type: true, params: true, createdAt: true },
      }),
    ]);

    let stats: Stat[] = [];
    let current = 0;
    const insights: Insight[] = [];
    const top = traffic[0];

    if (page === "overview") {
      const [cur, prev, s30, sPrev, customers, newCust, pending] = await Promise.all([
        this.paidRevenue(d30, now),
        this.paidRevenue(d60, d30),
        this.sessionStats(d30, now),
        this.sessionStats(d60, d30),
        this.prisma.customer.count(),
        this.prisma.customer.count({ where: { joinedAt: { gte: d30 } } }),
        this.prisma.order.count({ where: { status: "PENDING", createdAt: { gte: d30 } } }),
      ]);
      const conv = s30.sessions ? (cur.orders / s30.sessions) * 100 : 0;
      const convPrev = sPrev.sessions ? (prev.orders / sPrev.sessions) * 100 : 0;
      current = cur.revenue;
      if (top) insights.push({ type: "topSource", params: { key: top.key, n: top.value } });
      const rc = change(cur.revenue, prev.revenue);
      if (rc) insights.push({ type: "revenueChange", params: { pct: rc } });
      if (pending) insights.push({ type: "pendingOrders", params: { n: pending } });
      stats = [
        { key: "revenue", value: money(cur.revenue), trend: change(cur.revenue, prev.revenue) },
        { key: "orders", value: num(cur.orders), trend: change(cur.orders, prev.orders) },
        { key: "customers", value: num(customers), trend: delta(newCust) },
        { key: "conversion", value: pctText(conv), trend: change(conv, convPrev) },
      ];
    } else if (page === "analytics") {
      const [c, p, days] = await Promise.all([
        this.sessionStats(d30, now),
        this.sessionStats(d60, d30),
        this.prisma.$queryRaw<{ dow: number; total: number }[]>(
          Prisma.sql`SELECT EXTRACT(ISODOW FROM "createdAt")::int AS dow, COUNT(*)::int AS total FROM "Visit" WHERE "createdAt" >= ${d30} GROUP BY 1 ORDER BY 2 DESC LIMIT 1`,
        ),
      ]);
      current = c.sessions;
      if (top) insights.push({ type: "topSource", params: { key: top.key, n: top.value } });
      if (days[0]) insights.push({ type: "bestDay", params: { weekday: days[0].dow - 1 } });
      if (c.sessions) insights.push({ type: "bounce", params: { n: Math.round(c.bounceRate) } });
      stats = [
        { key: "sessions", value: num(c.sessions), trend: change(c.sessions, p.sessions) },
        { key: "bounceRate", value: pctText(c.bounceRate), trend: change(c.bounceRate, p.bounceRate) },
        { key: "avgDuration", value: mmss(c.avgDuration), trend: change(c.avgDuration, p.avgDuration) },
        { key: "pagesPerSession", value: c.pagesPerSession.toFixed(1), trend: change(c.pagesPerSession, p.pagesPerSession) },
      ];
    } else if (page === "customers") {
      const [total, active, paused, trials, spent, newCust] = await Promise.all([
        this.prisma.customer.count(),
        this.prisma.customer.count({ where: { status: "ACTIVE" } }),
        this.prisma.customer.count({ where: { status: "PAUSED" } }),
        this.prisma.customer.count({ where: { status: "TRIAL" } }),
        this.prisma.customer.aggregate({ _avg: { spent: true } }),
        this.prisma.customer.count({ where: { joinedAt: { gte: d30 } } }),
      ]);
      current = total;
      if (paused) insights.push({ type: "churn", params: { n: paused } });
      if (trials) insights.push({ type: "trials", params: { n: trials } });
      if (top) insights.push({ type: "topCustomerSource", params: { key: top.key } });
      stats = [
        { key: "activeUsers", value: num(active), trend: delta(newCust) },
        { key: "churn", value: pctText(total ? (paused / total) * 100 : 0), trend: null },
        { key: "trials", value: num(trials), trend: null },
        { key: "ltv", value: money(spent._avg.spent ?? 0), trend: null },
      ];
    } else if (page === "reports") {
      const [total, scheduled, ready, rows, c30, c60] = await Promise.all([
        this.prisma.report.count(),
        this.prisma.report.count({ where: { status: "SCHEDULED" } }),
        this.prisma.report.count({ where: { status: "READY" } }),
        this.prisma.report.aggregate({ _sum: { rows: true } }),
        this.prisma.report.count({ where: { createdAt: { gte: d30 } } }),
        this.prisma.report.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
      ]);
      current = total;
      insights.push(total ? { type: "scheduled", params: { n: scheduled } } : { type: "noReports", params: {} });
      stats = [
        { key: "generated", value: num(c30), trend: change(c30, c60) },
        { key: "automated", value: pctText(total ? (scheduled / total) * 100 : 0), trend: null },
        { key: "rowsTotal", value: num(rows._sum.rows ?? 0), trend: null },
        { key: "readyRate", value: pctText(total ? (ready / total) * 100 : 0), trend: null },
      ];
    } else {
      const [users, admins, complete, newUsers, sub] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: "ADMIN" } }),
        this.prisma.user.count({ where: { phone: { not: null }, company: { not: null } } }),
        this.prisma.user.count({ where: { createdAt: { gte: d30 } } }),
        this.plans.subscriptionFor(user.id),
      ]);
      current = users;
      insights.push({ type: "seats", params: { used: users, total: target } });
      if (users > complete) insights.push({ type: "incomplete", params: { n: users - complete } });
      stats = [
        { key: "teamSeats", value: `${users}/${target}`, trend: delta(newUsers) },
        { key: "admins", value: num(admins), trend: null },
        { key: "profileComplete", value: pctText(users ? (complete / users) * 100 : 0), trend: null },
        { key: "plan", value: sub.pro ? "Pro" : "Free", trend: null },
      ];
    }

    return {
      goal: { kind, current, target, progress: Math.min(100, Math.round((current / Math.max(1, target)) * 100)) },
      traffic,
      activity: feed,
      stats,
      insights: insights.slice(0, 3),
    };
  }

  async charts() {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
    const [rev, sess, topPages] = await Promise.all([
      this.prisma.$queryRaw<{ m: Date; total: number }[]>(
        Prisma.sql`SELECT date_trunc('month', "createdAt") AS m, COALESCE(SUM(amount),0)::int AS total FROM "Order" WHERE status = 'PAID'::"OrderStatus" AND "createdAt" >= ${monthStart} GROUP BY 1`,
      ),
      this.prisma.$queryRaw<{ d: Date; total: number }[]>(
        Prisma.sql`SELECT date_trunc('day', "createdAt") AS d, COUNT(*)::int AS total FROM "Visit" WHERE "createdAt" >= ${dayStart} GROUP BY 1`,
      ),
      this.prisma.visit.groupBy({ by: ["path"], where: { createdAt: { gte: new Date(+now - 30 * DAY) } }, _count: true, orderBy: { _count: { path: "desc" } }, take: 5 }),
    ]);
    const revByKey = new Map(rev.map((r) => [r.m.toISOString().slice(0, 7), r.total]));
    const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + i, 1));
      return { month: d.getUTCMonth(), value: revByKey.get(d.toISOString().slice(0, 7)) ?? 0 };
    });
    const sessByKey = new Map(sess.map((r) => [r.d.toISOString().slice(0, 10), r.total]));
    const sessionsByDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(+dayStart + i * DAY);
      return { weekday: (d.getUTCDay() + 6) % 7, value: sessByKey.get(d.toISOString().slice(0, 10)) ?? 0 }; // 0 = Monday
    });
    return { revenueByMonth, sessionsByDay, topPages: topPages.map((p) => ({ path: p.path, views: p._count })) };
  }
}
