import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createJWT } from "../src/utils/tokenUtils.js";
import exampaymentModel from "../src/modules/subscription/exampayment.model.js";
import applicationModel from "../src/modules/application/application.model.js";
import { loadMigrations } from "../src/migrations/runner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let app;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_for_vitest";
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
  const mod = await import("../src/app.js");
  app = mod.app;
}, 60000);

describe("S0-11 Backend Security, RBAC, Contract & DB Regression Suite", () => {
  it("GET /api/test returns 200 health JSON", async () => {
    const res = await request(app).get("/api/test");
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("The Spot Campus Final API");
  });

  it("AUD-013: POST /api/auth/register requires Admin auth (rejects unauthenticated)", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(401);
  });

  it("AUD-013: POST /api/auth/register rejects non-Admin role (Student)", async () => {
    const token = createJWT({ userId: "507f1f77bcf86cd799439011", role: "Student" });
    const res = await request(app)
      .post("/api/auth/register")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("AUD-013: /api/register does NOT expose StudentRouter GET /", async () => {
    const res = await request(app).get("/api/register");
    expect(res.status).toBe(404);
  });

  it("AUD-006 / AUD-009 / AUD-010: Admin-only routes reject Student role with 403", async () => {
    const studentToken = createJWT({ userId: "507f1f77bcf86cd799439011", role: "Student" });
    const r1 = await request(app).get("/api/stats/admin-report").set("Authorization", `Bearer ${studentToken}`);
    const r2 = await request(app).get("/api/stats/transactions").set("Authorization", `Bearer ${studentToken}`);
    const r3 = await request(app).get("/api/payment").set("Authorization", `Bearer ${studentToken}`);
    const r4 = await request(app).get("/api/contact").set("Authorization", `Bearer ${studentToken}`);
    const r5 = await request(app).post("/api/cv-templates/admin").set("Authorization", `Bearer ${studentToken}`);
    expect([r1.status, r2.status, r3.status, r4.status, r5.status]).toEqual([403, 403, 403, 403, 403]);
  });

  it("AUD-002 / AUD-005: University & Round routes enforce RBAC", async () => {
    const studentToken = createJWT({ userId: "507f1f77bcf86cd799439011", role: "Student" });
    const rUniDel = await request(app)
      .delete("/api/university/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${studentToken}`);
    const rRoundPost = await request(app)
      .post("/api/rounds/job/507f1f77bcf86cd799439011/rounds")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(rUniDel.status).toBe(403);
    expect(rRoundPost.status).toBe(403);
  });

  it("AUD-011: DELETE /api/upload/:filename rejects path traversal and unauthenticated access", async () => {
    const unauth = await request(app).delete("/api/upload/test.png");
    expect(unauth.status).toBe(401);

    const studentToken = createJWT({ userId: "507f1f77bcf86cd799439011", role: "Student" });
    const traversal = await request(app)
      .delete("/api/upload/..secret.png")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(traversal.status).toBe(400);
  });

  it("AUD-007: payment.controller.js and exampayment.controller.js use server-side pricing & timingSafeEqual", () => {
    const paySrc = fs.readFileSync(
      path.join(__dirname, "../src/modules/subscription/payment.controller.js"),
      "utf8"
    );
    const examPaySrc = fs.readFileSync(
      path.join(__dirname, "../src/modules/subscription/exampayment.controller.js"),
      "utf8"
    );
    expect(paySrc).toContain("authoritativeAmount = plan.price");
    expect(paySrc).toContain("crypto.timingSafeEqual");
    expect(examPaySrc).toContain("authoritativeAmount");
    expect(examPaySrc).toContain("crypto.timingSafeEqual");
  });

  it("AUD-015: paper.controller.js does not accept client-supplied proctoring.trustScore", () => {
    const paperSrc = fs.readFileSync(
      path.join(__dirname, "../src/modules/exam/paper.controller.js"),
      "utf8"
    );
    expect(paperSrc).not.toContain("req.body.proctoring.trustScore");
  });

  it("DB-002 & DB-004: exam_payment removes unique user_id and application has unique {student_id, job_id}", () => {
    const userIdPath = exampaymentModel.schema.path("user_id");
    expect(userIdPath.options.unique).not.toBe(true);
    const appIndexes = applicationModel.schema.indexes();
    const hasUniqueAppIdx = appIndexes.some(
      ([fields, opts]) => fields.student_id === 1 && fields.job_id === 1 && opts.unique === true
    );
    expect(hasUniqueAppIdx).toBe(true);
  });

  it("FEAT-023: Migration runner loads ordered migrations cleanly", async () => {
    const migrations = await loadMigrations();
    expect(migrations.length).toBeGreaterThanOrEqual(3);
    expect(migrations[0].id).toBe("001_fix_exampayment_index");
  });
});
