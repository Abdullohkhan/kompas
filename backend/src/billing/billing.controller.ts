import { Controller, Get, Headers, HttpCode, Post, type RawBodyRequest, Req } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request } from "express";
import { CurrentUser, Public } from "../auth/auth.decorators";
import type { AuthUser } from "../auth/auth.types";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("status")
  status(@CurrentUser() user: AuthUser) {
    return this.billing.status(user);
  }

  @Post("checkout")
  checkout(@CurrentUser() user: AuthUser) {
    return this.billing.checkout(user.id);
  }

  @Post("portal")
  portal(@CurrentUser() user: AuthUser) {
    return this.billing.portal(user.id);
  }

  /** Called by Stripe (not the browser). Authenticated by the signature, not by a cookie. */
  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @Post("webhook")
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers("stripe-signature") signature?: string) {
    await this.billing.handleWebhook(req.rawBody, signature);
    return { received: true };
  }
}
