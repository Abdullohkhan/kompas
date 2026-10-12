import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, NotFoundException, Param, Post } from "@nestjs/common";
import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";
import { CurrentUser } from "../auth/auth.decorators";
import type { AuthUser } from "../auth/auth.types";
import { ReportType } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

class CreateReportDto {
  @IsString() @MinLength(1) @MaxLength(120) name: string;
  @IsEnum(ReportType) type: ReportType;
}

@Controller("reports")
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  }

  @Post()
  create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthUser) {
    return this.prisma.report.create({
      data: { customName: dto.name.trim(), type: dto.type, status: "READY", createdById: user.id },
    });
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
}
