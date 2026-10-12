import { Global, Injectable, Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export const FREE_REPORT_LIMIT = 3;
const ACTIVE = new Set(["active", "trialing"]);

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  async subscriptionFor(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    const live = !!sub && ACTIVE.has(sub.status) && (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date());
    return { sub, pro: live };
  }

  /** Admins are never limited; everyone else needs an active Stripe subscription. */
  async isPro(user: { id: string; role: string }) {
    if (user.role === "ADMIN") return true;
    return (await this.subscriptionFor(user.id)).pro;
  }
}

@Global()
@Module({ providers: [PlanService], exports: [PlanService] })
export class PlanModule {}
