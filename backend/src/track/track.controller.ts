import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, Max, Min } from "class-validator";
import { Public } from "../auth/auth.decorators";
import { VisitSource } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

class TrackDto {
  @IsString() @MaxLength(200) @Matches(/^\//) path: string;
  @IsOptional() @IsEnum(VisitSource) source?: VisitSource;
  @IsOptional() @IsInt() @Min(1) @Max(200) pageviews?: number;
  @IsOptional() @IsInt() @Min(0) @Max(36_000) durationSec?: number;
  @IsOptional() @IsBoolean() bounced?: boolean;
}

/** Public ingestion endpoint for website sessions (CORS_ORIGIN must allow the tracked site). */
@Controller("track")
export class TrackController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @HttpCode(204)
  @Post()
  async track(@Body() dto: TrackDto) {
    const pageviews = dto.pageviews ?? 1;
    await this.prisma.visit.create({
      data: {
        path: dto.path,
        source: dto.source ?? "DIRECT",
        pageviews,
        durationSec: dto.durationSec ?? 0,
        bounced: dto.bounced ?? pageviews <= 1,
      },
    });
  }
}
