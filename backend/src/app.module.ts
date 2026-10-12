import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ActivityModule } from "./common/activity.service";
import { PlanModule } from "./common/plan.service";
import { BillingModule } from "./billing/billing.module";
import { OrdersModule } from "./orders/orders.module";
import { TrackModule } from "./track/track.module";
import { AuthModule } from "./auth/auth.module";
import { validateEnv } from "./config";
import { HealthController } from "./common/health.controller";
import { CustomersModule } from "./customers/customers.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReportsModule } from "./reports/reports.module";
import { TeamModule } from "./team/team.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    ActivityModule,
    PlanModule,
    AuthModule,
    DashboardModule,
    CustomersModule,
    ReportsModule,
    TeamModule,
    OrdersModule,
    TrackModule,
    BillingModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
