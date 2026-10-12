import { randomBytes } from "node:crypto";
import { Body, ConflictException, Controller, Get, Post } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { Roles } from "../auth/auth.decorators";
import { ActivityService } from "../common/activity.service";
import { Role } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

class InviteDto {
  @IsEmail() email: string;
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
}

@Controller("team")
export class TeamController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  @Get()
  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  /** Admin-only: creates the account with a one-time temporary password, returned once in the response. */
  @Roles("ADMIN")
  @Post("invite")
  async invite(@Body() dto: InviteDto) {
    const email = dto.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException("Email already registered");
    const tempPassword = randomBytes(9).toString("base64url");
    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name?.trim() || email.split("@")[0],
        role: dto.role ?? "USER",
        passwordHash: await bcrypt.hash(tempPassword, 12),
      },
      select: { id: true, name: true, email: true, role: true },
    });
    await this.activity.log("memberInvited", "team", { email: user.email });
    return { user, tempPassword };
  }
}
