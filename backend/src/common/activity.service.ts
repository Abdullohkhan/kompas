import { Global, Injectable, Module } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type ActivityCategory = "orders" | "customers" | "reports" | "team" | "billing" | "security";

/** Writes the event feed shown on the dashboard. Failures never break the request that triggered them. */
@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(type: string, category: ActivityCategory, params?: Record<string, string | number>) {
    try {
      await this.prisma.activity.create({ data: { type, category, params: params as Prisma.InputJsonValue | undefined } });
    } catch {
      // the feed is best-effort
    }
  }
}

@Global()
@Module({ providers: [ActivityService], exports: [ActivityService] })
export class ActivityModule {}
