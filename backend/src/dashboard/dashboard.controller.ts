import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const PAGES = ["overview", "analytics", "customers", "reports", "settings"];

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  /** Chart series + top pages used by the Overview / Analytics views. */
  @Get("charts")
  async charts() {
    const [series, topPages] = await Promise.all([
      this.prisma.chartSeries.findMany(),
      this.prisma.topPage.findMany({ orderBy: { views: "desc" }, select: { path: true, views: true } }),
    ]);
    const byKey = Object.fromEntries(series.map((s) => [s.key, s.values]));
    return { revenueByMonth: byKey.revenue ?? [], sessionsByWeekday: byKey.sessions ?? [], topPages };
  }

  @Get(":page")
  async page(@Param("page") page: string) {
    if (!PAGES.includes(page)) throw new NotFoundException();
    const row = await this.prisma.pageMetrics.findUnique({ where: { page } });
    if (!row) throw new NotFoundException();
    return { goalProgress: row.goalProgress, traffic: row.traffic, activity: row.activity, stats: row.stats };
  }
}
