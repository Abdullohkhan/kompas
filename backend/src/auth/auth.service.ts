import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import type { User } from "../generated/prisma/client";
import { ActivityService } from "../common/activity.service";
import { PrismaService } from "../prisma/prisma.service";
import type { ChangePasswordDto, LoginDto, RegisterDto, UpdateProfileDto } from "./auth.dto";

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

export const publicUser = (u: User) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  phone: u.phone,
  company: u.company,
  role: u.role,
});

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly activity: ActivityService,
  ) {}

  sign(user: User) {
    return this.jwt.signAsync({ sub: user.id, role: user.role });
  }

  async register(dto: RegisterDto) {
    if (!this.config.get<boolean>("ALLOW_REGISTRATION")) throw new ForbiddenException("Registration is disabled");
    const email = dto.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException("Email already registered");
    const user = await this.prisma.user.create({
      data: { email, name: dto.name, passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS) }, // role defaults to USER
    });
    await this.activity.log("signedUp", "team", { name: user.name });
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedException("Invalid email or password");
    await this.activity.log("login", "security", { name: user.name });
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    await this.activity.log("profileUpdated", "team", { name: user.name });
    return user;
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) throw new UnauthorizedException("Invalid current password");
    await this.prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS) } });
    await this.activity.log("passwordChanged", "security", { name: user.name });
  }

  async me(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
