import { Body, Controller, Get, HttpCode, Patch, Post, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { CurrentUser, Public } from "./auth.decorators";
import { ChangePasswordDto, LoginDto, RegisterDto, UpdateProfileDto } from "./auth.dto";
import { AuthService, publicUser } from "./auth.service";
import { AUTH_COOKIE, type AuthUser } from "./auth.types";
import type { User } from "../generated/prisma/client";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private async setCookie(res: Response, user: User) {
    res.cookie(AUTH_COOKIE, await this.auth.sign(user), {
      httpOnly: true,
      secure: this.config.get("NODE_ENV") === "production",
      sameSite: "lax",
      maxAge: WEEK_MS,
      path: "/",
    });
  }

  /** Lets the login page hide the sign-up form when registration is closed. */
  @Public()
  @Get("config")
  authConfig() {
    return { registration: this.config.get<boolean>("ALLOW_REGISTRATION") === true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.register(dto);
    await this.setCookie(res, user);
    return { user: publicUser(user) };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.login(dto);
    await this.setCookie(res, user);
    return { user: publicUser(user) };
  }

  @Public()
  @HttpCode(204)
  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, { path: "/" });
  }

  @Get("me")
  async me(@CurrentUser() user: AuthUser) {
    return { user: publicUser(await this.auth.me(user.id)) };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(204)
  @Post("change-password")
  async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(user.id, dto);
  }

  @Patch("me")
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return { user: publicUser(await this.auth.updateProfile(user.id, dto)) };
  }
}
