import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpException, HttpStatus, NotFoundException, Param, Post, Res } from "@nestjs/common";
import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";
import type { Response } from "express";
import { CurrentUser } from "../auth/auth.decorators";
import type { AuthUser } from "../auth/auth.types";
import { ActivityService } from "../common/activity.service";
import { toCsv } from "../common/csv";
import { FREE_REPORT_LIMIT, PlanService } from "../common/plan.service";
import { ReportType } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

class CreateReportDto {
  @IsString() @MinLength(1) @MaxLength(120) name: string;
  @IsEnum(ReportType) type: ReportType;
}

@Controller("reports")
export class ReportsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlanService,
    private readonly activity: ActivityService,
  ) {}

  @Get()
  list() {
    return this.prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  }

  /** Free plan: up to FREE_REPORT_LIMIT reports per user; Pro and admins are unlimited. */
  @Post()
  async create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthUser) {
    if (!(await this.plans.isPro(user))) {
      const mine = await this.prisma.report.count({ where: { createdById: user.id } });
      if (mine >= FREE_REPORT_LIMIT) throw new HttpException("plan_limit", HttpStatus.PAYMENT_REQUIRED);
    }
    const name = dto.name.trim();
    const rows = (await this.buildRows(dto.type)).length - 1;
    const report = await this.prisma.report.create({
      data: { customName: name, type: dto.type, status: "READY", rows: Math.max(0, rows), createdById: user.id },
    });
    await this.activity.log("reportCreated", "reports", { name });
    return report;
  }

  /** Real data behind the report, generated on demand. Pro feature (admins included). */
  @Get(":id/export")
  async export(@Param("id") id: string, @CurrentUser() user: AuthUser, @Res() res: Response) {
    if (!(await this.plans.isPro(user))) throw new ForbiddenException("pro_required");
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException();
    const rows = await this.buildRows(report.type);
    await this.activity.log("reportExported", "reports", { name: report.customName ?? report.nameKey ?? report.type });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="kompas-report-${report.type.toLowerCase()}.csv"`);
    res.send(toCsv(rows));
  }

  /** Authors can delete their own reports; admins any report. */
  @HttpCode(204)
  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException();
    if (user.role !== "ADMIN" && report.createdById !== user.id) throw new ForbiddenException();
    await this.prisma.report.delete({ where: { id } });
  }

  private async buildRows(type: ReportType): Promise<unknown[][]> {
    if (type === "SALES") {
      const orders = await this.prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5000, include: { customer: { select: { name: true } } } });
      return [["order", "date", "customer", "amount_usd", "status"], ...orders.map((o) => [o.number, o.createdAt.toISOString(), o.customer?.name ?? "", o.amount, o.status])];
    }
    if (type === "FINANCE") {
      const g = await this.prisma.$queryRaw<{ m: string; revenue: number; orders: number }[]>`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS m, SUM(amount)::int AS revenue, COUNT(*)::int AS orders
        FROM "Order" WHERE status = 'PAID'::"OrderStatus" GROUP BY 1 ORDER BY 1`;
      return [["month", "revenue_usd", "paid_orders"], ...g.map((r) => [r.m, r.revenue, r.orders])];
    }
    if (type === "MARKETING") {
      const g = await this.prisma.visit.groupBy({ by: ["source"], _count: true, _avg: { durationSec: true, pageviews: true } });
      return [["source", "sessions", "avg_duration_sec", "avg_pageviews"], ...g.map((r) => [r.source, r._count, Math.round(r._avg.durationSec ?? 0), (r._avg.pageviews ?? 0).toFixed(1)])];
    }
    const a = await this.prisma.activity.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
    return [["date", "category", "type"], ...a.map((x) => [x.createdAt.toISOString(), x.category, x.type])];
  }
}
