import { CustomerSource, CustomerStatus, PlanKey } from "../generated/prisma/client";
import { IsDateString, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateCustomerDto {
  @IsString() @MinLength(1) @MaxLength(100) name: string;
  @IsEmail() email: string;
  @IsString() @MaxLength(120) company: string;
  @IsString() @MaxLength(40) phone: string;
  @IsEnum(PlanKey) plan: PlanKey;
  @IsEnum(CustomerStatus) status: CustomerStatus;
  @IsOptional() @IsEnum(CustomerSource) source?: CustomerSource;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) spent?: number;
  @IsOptional() @IsDateString() joinedAt?: string;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(120) company?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsEnum(PlanKey) plan?: PlanKey;
  @IsOptional() @IsEnum(CustomerStatus) status?: CustomerStatus;
  @IsOptional() @IsEnum(CustomerSource) source?: CustomerSource;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) spent?: number;
}
