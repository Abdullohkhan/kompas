import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { Roles } from "../auth/auth.decorators";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCustomerDto, UpdateCustomerDto } from "./customers.dto";

@Controller("customers")
export class CustomersController {
  constructor(private readonly prisma: PrismaService) {}

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
  create(@Body() dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: { ...dto, email: dto.email.toLowerCase(), joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : new Date() },
    });
  }

  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    await this.ensure(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  @Roles("ADMIN")
  @HttpCode(204)
  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.ensure(id);
    await this.prisma.customer.delete({ where: { id } });
  }

  private async ensure(id: string) {
    if (!(await this.prisma.customer.findUnique({ where: { id }, select: { id: true } }))) throw new NotFoundException();
  }
}
