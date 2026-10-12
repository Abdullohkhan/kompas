import { Body, ConflictException, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { Roles } from "../auth/auth.decorators";
import { ActivityService } from "../common/activity.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCustomerDto, UpdateCustomerDto } from "./customers.dto";

@Controller("customers")
export class CustomersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  @Get()
  list(@Query("q") q?: string) {
    const term = q?.trim();
    return this.prisma.customer.findMany({
      where: term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { email: { contains: term, mode: "insensitive" } },
              { company: { contains: term, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { joinedAt: "desc" },
      take: 200,
    });
  }

  @Roles("ADMIN")
  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    const email = dto.email.toLowerCase();
    if (await this.prisma.customer.findUnique({ where: { email }, select: { id: true } })) throw new ConflictException("Customer already exists");
    const customer = await this.prisma.customer.create({
      data: { ...dto, email, joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : new Date() },
    });
    await this.activity.log("customerAdded", "customers", { name: customer.name });
    return customer;
  }

  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    await this.ensure(id);
    const customer = await this.prisma.customer.update({ where: { id }, data: dto });
    await this.activity.log("customerUpdated", "customers", { name: customer.name });
    return customer;
  }

  @Roles("ADMIN")
  @HttpCode(204)
  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.ensure(id);
    const customer = await this.prisma.customer.delete({ where: { id } });
    await this.activity.log("customerRemoved", "customers", { name: customer.name });
  }

  private async ensure(id: string) {
    if (!(await this.prisma.customer.findUnique({ where: { id }, select: { id: true } }))) throw new NotFoundException();
  }
}
