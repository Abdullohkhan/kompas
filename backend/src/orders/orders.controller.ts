import { Body, Controller, Get, NotFoundException, Post } from "@nestjs/common";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Roles } from "../auth/auth.decorators";
import { ActivityService } from "../common/activity.service";
import { OrderStatus } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

class CreateOrderDto {
  @IsInt() @Min(1) @Max(10_000_000) amount: number;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
}

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  @Get()
  list() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { customer: { select: { id: true, name: true } } },
    });
  }

  @Roles("ADMIN")
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const status = dto.status ?? "PAID";
    if (dto.customerId && !(await this.prisma.customer.findUnique({ where: { id: dto.customerId }, select: { id: true } }))) {
      throw new NotFoundException("Customer not found");
    }
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({ data: { amount: dto.amount, status, customerId: dto.customerId } });
      if (dto.customerId && status === "PAID") {
        await tx.customer.update({ where: { id: dto.customerId }, data: { spent: { increment: dto.amount } } });
      }
      return created;
    });
    await this.activity.log("orderCreated", "orders", { number: order.number, amount: order.amount });
    return order;
  }
}
