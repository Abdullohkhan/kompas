-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "PlanKey" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'TRIAL', 'PAUSED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('SALES', 'FINANCE', 'MARKETING', 'OPS');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('READY', 'SCHEDULED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "plan" "PlanKey" NOT NULL,
    "status" "CustomerStatus" NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "nameKey" TEXT,
    "customName" TEXT,
    "type" "ReportType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'READY',
    "rows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageMetrics" (
    "page" TEXT NOT NULL,
    "goalProgress" INTEGER NOT NULL,
    "traffic" JSONB NOT NULL,
    "activity" JSONB NOT NULL,
    "stats" JSONB NOT NULL,

    CONSTRAINT "PageMetrics_pkey" PRIMARY KEY ("page")
);

-- CreateTable
CREATE TABLE "ChartSeries" (
    "key" TEXT NOT NULL,
    "values" JSONB NOT NULL,

    CONSTRAINT "ChartSeries_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "TopPage" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "views" INTEGER NOT NULL,

    CONSTRAINT "TopPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TopPage_path_key" ON "TopPage"("path");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
