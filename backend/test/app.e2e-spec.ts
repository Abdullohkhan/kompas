import "dotenv/config";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { configureApp } from "../src/setup";

// Needs a reachable DATABASE_URL (migrated + seeded) and JWT_SECRET, e.g. the local dev database.
describe("API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `e2e-${Date.now()}@example.com`;
  const password = "e2e-test-password";

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.report.deleteMany({ where: { customName: "E2E report" } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it("rejects unauthenticated access", async () => {
    await http().get("/api/customers").expect(401);
    await http().get("/api/dashboard/overview").expect(401);
    await http().get("/api/health").expect(200);
  });

  it("validates input and ignores a client-supplied role", async () => {
    await http().post("/api/auth/register").send({ email: "bad", password: "x", name: "A" }).expect(400);
    await http().post("/api/auth/register").send({ email, password, name: "E2E", role: "ADMIN" }).expect(400);
  });

  it("registers a USER, sets an httpOnly cookie and serves data", async () => {
    const agent = request.agent(app.getHttpServer());
    const res = await agent.post("/api/auth/register").send({ email, password, name: "E2E" }).expect(201);
    expect(res.body.user.role).toBe("USER");
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(String(res.headers["set-cookie"])).toMatch(/HttpOnly/);
    await agent.get("/api/auth/me").expect(200);
    await agent.get("/api/customers").expect(200);
    await agent.post("/api/reports").send({ name: "E2E report", type: "SALES" }).expect(201);
  });

  it("forbids USER from admin-only routes", async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post("/api/auth/login").send({ email, password }).expect(200);
    await agent
      .post("/api/customers")
      .send({ name: "X", email: "x@example.com", company: "X", phone: "1", plan: "FREE", status: "ACTIVE" })
      .expect(403);
    await agent.post("/api/team/invite").send({ email: "y@example.com" }).expect(403);
  });

  it("rejects wrong password and clears the cookie on logout", async () => {
    await http().post("/api/auth/login").send({ email, password: "wrong-password" }).expect(401);
    const agent = request.agent(app.getHttpServer());
    await agent.post("/api/auth/login").send({ email, password }).expect(200);
    await agent.post("/api/auth/logout").expect(204);
    await agent.get("/api/auth/me").expect(401);
  });
});
