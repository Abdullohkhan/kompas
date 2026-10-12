import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Res } from "@nestjs/common";
import { IsIn, IsInt, Max, Min } from "class-validator";
import type { Response } from "express";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthUser } from "../auth/auth.types";
import { toCsv } from "../common/csv";
import { PlanService } from "../common/plan.service";
import { DashboardService, type PageId } from "./dashboard.service";

const PAGES: PageId[] = ["overview", "analytics", "customers", "reports", "settings"];

class GoalDto {
  @IsIn(["revenue", "sessions", "customers", "reports", "seats"]) kind: "revenue" | "sessions" | "customers" | "reports" | "seats";
  @IsInt() @Min(1) @Max(1_000_000_000) value: number;
}

@Controller("dashboard")
export class DashboardController {
  constructor(
    private readonly service: DashboardService,
    private readonly plans: PlanService,
  ) {}

  /** Chart series + top pages used by the Overview / Analytics views. */
  @Get("charts")
  charts() {
    return this.service.charts();
  }

  @Roles("ADMIN")
  @Patch("goals")
  async goal(@Body() dto: GoalDto) {
    await this.service.setGoal(dto.kind, dto.value);
    return { ok: true };
  }

  @Get(":page")
  page(@Param("page") page: string, @CurrentUser() user: AuthUser) {
    return this.service.page(this.validPage(page), user);
  }

  /** Server-built CSV of the page's figures. Pro feature (admins included). */
  @Get(":page/export")
  async export(@Param("page") page: string, @CurrentUser() user: AuthUser, @Res() res: Response) {
    const id = this.validPage(page);
    if (!(await this.plans.isPro(user))) throw new ForbiddenException("pro_required");
    const data = await this.service.page(id, user);
    const rows: unknown[][] = [
      ["section", "metric", "value", "change"],
      ...data.stats.map((s) => [id, s.key, s.value, s.trend ?? ""]),
      [],
      ["section", "metric", "share_percent"],
      ...data.traffic.map((t) => [`${id}_breakdown`, t.key, t.value]),
    ];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="kompas-${id}.csv"`);
    res.send(toCsv(rows));
  }

  private validPage(page: string): PageId {
    if (!PAGES.includes(page as PageId)) throw new NotFoundException();
    return page as PageId;
  }
}
