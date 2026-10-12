import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { ActivityService } from "../common/activity.service";
import { PlanService } from "../common/plan.service";
import { PrismaService } from "../prisma/prisma.service";

type Subscription = Stripe.Subscription;

@Injectable()
export class BillingService {
  private readonly log = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly plans: PlanService,
    private readonly activity: ActivityService,
  ) {
    const key = this.config.get<string>("STRIPE_SECRET_KEY");
    this.stripe = key ? new Stripe(key) : null;
  }

  private get client() {
    if (!this.stripe) throw new ServiceUnavailableException("Billing is not configured");
    return this.stripe;
  }

  async status(user: { id: string; role: string }) {
    const { sub, pro } = await this.plans.subscriptionFor(user.id);
    return {
      configured: Boolean(this.stripe && this.config.get("STRIPE_PRICE_ID")),
      plan: (await this.plans.isPro(user)) ? "pro" : "free",
      viaSubscription: pro,
      status: sub?.status ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    };
  }

  private async customerFor(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.stripeCustomerId) return user.stripeCustomerId;
    const customer = await this.client.customers.create({ email: user.email, name: user.name, metadata: { userId } });
    await this.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
    return customer.id;
  }

  async checkout(userId: string) {
    const price = this.config.get<string>("STRIPE_PRICE_ID");
    if (!price) throw new ServiceUnavailableException("Billing is not configured");
    if ((await this.plans.subscriptionFor(userId)).pro) throw new BadRequestException("Already subscribed");
    const appUrl = this.config.getOrThrow<string>("APP_URL");
    const session = await this.client.checkout.sessions.create({
      mode: "subscription",
      customer: await this.customerFor(userId),
      client_reference_id: userId,
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { userId } },
      success_url: `${appUrl}/settings?billing=success`,
      cancel_url: `${appUrl}/settings?billing=cancelled`,
    });
    return { url: session.url };
  }

  async portal(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.stripeCustomerId) throw new BadRequestException("No billing account yet");
    const session = await this.client.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.config.getOrThrow<string>("APP_URL")}/settings`,
    });
    return { url: session.url };
  }

  /** Verifies the signature, ignores replays, then syncs our subscription table from Stripe's events. */
  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    const secret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!secret) throw new ServiceUnavailableException("Billing is not configured");
    if (!rawBody || !signature) throw new BadRequestException("Missing signature");
    let event: Stripe.Event;
    try {
      event = this.client.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new BadRequestException("Invalid signature");
    }

    try {
      await this.prisma.processedWebhook.create({ data: { id: event.id } });
    } catch {
      return; // already handled
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode === "subscription" && typeof session.subscription === "string") {
            await this.syncSubscription(await this.client.subscriptions.retrieve(session.subscription), session.client_reference_id);
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await this.syncSubscription(event.data.object as Subscription);
          break;
        case "invoice.payment_failed":
          await this.activity.log("paymentFailed", "billing");
          break;
        default:
          break;
      }
    } catch (error) {
      // Let Stripe retry: forget the event id so the retry is processed.
      await this.prisma.processedWebhook.delete({ where: { id: event.id } }).catch(() => undefined);
      this.log.error(`Webhook ${event.type} failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async syncSubscription(sub: Subscription, userIdHint?: string | null) {
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const user =
      (userIdHint ? await this.prisma.user.findUnique({ where: { id: userIdHint } }) : null) ??
      (sub.metadata?.userId ? await this.prisma.user.findUnique({ where: { id: sub.metadata.userId } }) : null) ??
      (await this.prisma.user.findUnique({ where: { stripeCustomerId: customerId } }));
    if (!user) {
      this.log.warn(`Subscription ${sub.id} has no matching user`);
      return;
    }
    // Newer Stripe API versions keep the period on the subscription item.
    const raw = sub as unknown as { current_period_end?: number; items?: { data?: { current_period_end?: number }[] } };
    const periodEnd = raw.current_period_end ?? raw.items?.data?.[0]?.current_period_end;
    const before = await this.plans.subscriptionFor(user.id);
    const data = {
      status: sub.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      stripeSubscriptionId: sub.id,
    };
    await this.prisma.subscription.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data } });
    if (!user.stripeCustomerId) await this.prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    const after = await this.plans.subscriptionFor(user.id);
    if (!before.pro && after.pro) await this.activity.log("subscriptionStarted", "billing", { name: user.name });
    if (before.pro && !after.pro) await this.activity.log("subscriptionEnded", "billing", { name: user.name });
  }
}
