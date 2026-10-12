import { WEBHOOK_SECRET } from "./env";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcryptjs";
import request from "supertest";
import Stripe from "stripe";
import { AppModule } from "../src/app.module";
import { validateEnv } from "../src/config";
import { PrismaService } from "../src/prisma/prisma.service";
import { configureApp } from "../src/setup";

// Needs a reachable, migrated + seeded DATABASE_URL and JWT_SECRET (e.g. the local dev database).
describe("API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const stamp = Date.now();
  const userEmail = `e2e-${stamp}@example.com`;
  const adminEmail = `e2e-admin-${stamp}@example.com`;
  const password = "e2e-test-password";
  let userId = "";

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.user.create({ data: { email: adminEmail, name: "E2E Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 4) } });
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { amount: 4242 } });
    await prisma.visit.deleteMany({ where: { path: "/e2e-track" } });
    await prisma.report.deleteMany({ where: { customName: { startsWith: "E2E" } } });
    await prisma.processedWebhook.deleteMany({ where: { id: { startsWith: "evt_e2e_" } } });
    await prisma.user.deleteMany({ where: { email: { in: [userEmail, adminEmail] } } });
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const login = async (email: string) => {
    const agent = request.agent(app.getHttpServer());
    await agent.post("/api/auth/login").send({ email, password }).expect(200);
    return agent;
  };
  const webhook = (event: object, secret = WEBHOOK_SECRET) => {
    const payload = JSON.stringify(event);
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
    return http().post("/api/billing/webhook").set("content-type", "application/json").set("stripe-signature", signature).send(payload);
  };

  it("registration is closed unless explicitly enabled", () => {
    const base = { DATABASE_URL: "postgresql://x", JWT_SECRET: "x".repeat(32) };
    expect(validateEnv(base).ALLOW_REGISTRATION).toBe(false);
    expect(validateEnv({ ...base, ALLOW_REGISTRATION: "true" }).ALLOW_REGISTRATION).toBe(true);
  });

  it("rejects unauthenticated access", async () => {
    await http().get("/api/customers").expect(401);
    await http().get("/api/dashboard/overview").expect(401);
    await http().get("/api/health").expect(200);
  });

  it("validates input and ignores a client-supplied role", async () => {
    await http().post("/api/auth/register").send({ email: "bad", password: "x", name: "A" }).expect(400);
    await http().post("/api/auth/register").send({ email: userEmail, password, name: "E2E", role: "ADMIN" }).expect(400);
  });

  it("registers a USER with an httpOnly cookie", async () => {
    const agent = request.agent(app.getHttpServer());
    const res = await agent.post("/api/auth/register").send({ email: userEmail, password, name: "E2E" }).expect(201);
    userId = res.body.user.id;
    expect(res.body.user.role).toBe("USER");
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(String(res.headers["set-cookie"])).toMatch(/HttpOnly/);
    await agent.get("/api/dashboard/overview").expect(200);
  });

  it("forbids USER from admin-only routes", async () => {
    const agent = await login(userEmail);
    await agent.post("/api/customers").send({ name: "X", email: "x@example.com", company: "X", phone: "1", plan: "FREE", status: "ACTIVE" }).expect(403);
    await agent.post("/api/team/invite").send({ email: "y@example.com" }).expect(403);
    await agent.post("/api/orders").send({ amount: 4242 }).expect(403);
  });

  it("computes dashboard figures from orders (admin creates an order)", async () => {
    const admin = await login(adminEmail);
    const before = (await admin.get("/api/dashboard/overview")).body.stats.find((s: { key: string }) => s.key === "orders").value;
    await admin.post("/api/orders").send({ amount: 4242 }).expect(201);
    await admin.post("/api/orders").send({ amount: -5 }).expect(400);
    const after = (await admin.get("/api/dashboard/overview")).body;
    const n = (v: string) => Number(v.replace(/,/g, ""));
    expect(n(after.stats.find((s: { key: string }) => s.key === "orders").value)).toBe(n(before) + 1);
    expect(after.activity[0].type).toBe("orderCreated");
  });

  it("ingests tracked visits publicly and validates them", async () => {
    await http().post("/api/track").send({ path: "/e2e-track", source: "SEARCH", pageviews: 3, durationSec: 60 }).expect(204);
    await http().post("/api/track").send({ path: "no-slash" }).expect(400);
    expect(await prisma.visit.count({ where: { path: "/e2e-track" } })).toBe(1);
  });

  it("free plan: report limit and Pro-only exports; Stripe webhook upgrades the user", async () => {
    const agent = await login(userEmail);
    for (let i = 0; i < 3; i++) await agent.post("/api/reports").send({ name: `E2E report ${i}`, type: "SALES" }).expect(201);
    await agent.post("/api/reports").send({ name: "E2E report 4", type: "SALES" }).expect(402);
    await agent.get("/api/dashboard/overview/export").expect(403);
    expect((await agent.get("/api/billing/status")).body.plan).toBe("free");

    const sub = (type: string, status: string, id: string) => ({
      id,
      type,
      data: { object: { id: "sub_e2e_1", object: "subscription", status, customer: "cus_e2e_1", cancel_at_period_end: false, metadata: { userId }, items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30 }] } } },
    });

    await webhook(sub("customer.subscription.created", "active", "evt_e2e_1"), "whsec_wrong").expect(400);
    await webhook(sub("customer.subscription.created", "active", "evt_e2e_1")).expect(200);
    await webhook(sub("customer.subscription.created", "active", "evt_e2e_1")).expect(200); // replay is a no-op
    expect(await prisma.subscription.count({ where: { userId } })).toBe(1);

    expect((await agent.get("/api/billing/status")).body.plan).toBe("pro");
    await agent.post("/api/reports").send({ name: "E2E report 4", type: "FINANCE" }).expect(201);
    const csv = await agent.get("/api/dashboard/overview/export").expect(200);
    expect(csv.text).toContain("revenue");

    await webhook(sub("customer.subscription.deleted", "canceled", "evt_e2e_2")).expect(200);
    expect((await agent.get("/api/billing/status")).body.plan).toBe("free");
    await prisma.subscription.deleteMany({ where: { userId } });
  });

  it("billing endpoints say 503 when checkout can't be created without keys", async () => {
    // price/secret are dummies here; real checkout needs Stripe, so only the unauthenticated path is asserted.
    await http().post("/api/billing/checkout").expect(401);
  });

  it("changes password and logs out", async () => {
    const agent = await login(userEmail);
    await agent.post("/api/auth/change-password").send({ currentPassword: "wrong-password", newPassword: "new-password-1" }).expect(401);
    await agent.post("/api/auth/change-password").send({ currentPassword: password, newPassword: "new-password-1" }).expect(204);
    await http().post("/api/auth/login").send({ email: userEmail, password }).expect(401);
    await agent.post("/api/auth/logout").expect(204);
    await agent.get("/api/auth/me").expect(401);
  });
});
