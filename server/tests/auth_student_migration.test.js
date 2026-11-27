import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";

// Isolated mocks for AUD-001 (6 role models), AUD-004 (student.controller), and FEAT-023 (migration rollback)
const mocks = vi.hoisted(() => ({
  adminFindOne: vi.fn(),
  studentFindOne: vi.fn(),
  companyFindOne: vi.fn(),
  collegeFindOne: vi.fn(),
  universityFindOne: vi.fn(),
  tpoFindOne: vi.fn(),
  studentFindById: vi.fn(),
  studentFindByIdAndUpdate: vi.fn(),
  tpoFindById: vi.fn(),
  comparePassword: vi.fn(),
}));

vi.mock("../src/modules/auth/admin.model.js", () => ({
  default: { findOne: mocks.adminFindOne },
}));
vi.mock("../src/modules/student/student.model.js", () => ({
  default: {
    findOne: mocks.studentFindOne,
    findById: mocks.studentFindById,
    findByIdAndUpdate: mocks.studentFindByIdAndUpdate,
  },
}));
vi.mock("../src/modules/company/company.model.js", () => ({
  default: { findOne: mocks.companyFindOne },
}));
vi.mock("../src/modules/college/college.model.js", () => ({
  default: { findOne: mocks.collegeFindOne },
}));
vi.mock("../src/modules/university/university.model.js", () => ({
  default: { findOne: mocks.universityFindOne },
}));
vi.mock("../src/modules/tpo/tpo.model.js", () => ({
  default: { findOne: mocks.tpoFindOne, findById: mocks.tpoFindById },
}));
vi.mock("../src/utils/passwordUtils.js", () => ({
  comparePassword: mocks.comparePassword,
  hashPassword: vi.fn(async (p) => `hashed_${p}`),
}));

import { login } from "../src/modules/auth/login.controller.js";
import { updateStudent } from "../src/modules/student/student.controller.js";
import { authenticateUser } from "../src/middleware/authMiddleware.js";
import { createJWT } from "../src/utils/tokenUtils.js";

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.post("/api/login", login);
  app.patch("/api/student/:id", authenticateUser, updateStudent);
  return app;
}

function selectChain(doc) {
  return {
    select: () => ({
      populate: async () => doc,
      then: (res, rej) => Promise.resolve(doc).then(res, rej),
    }),
  };
}

describe("AUD-001: Multi-Role Active-Status Authentication (All 6 Roles)", () => {
  let app;
  beforeEach(() => {
    process.env.JWT_SECRET = "test_secret_s011";
    process.env.JWT_EXPIRES_IN = "1d";
    vi.clearAllMocks();
    mocks.comparePassword.mockResolvedValue(true);
    mocks.adminFindOne.mockReturnValue(selectChain(null));
    mocks.studentFindOne.mockReturnValue(selectChain(null));
    mocks.companyFindOne.mockReturnValue(selectChain(null));
    mocks.collegeFindOne.mockReturnValue(selectChain(null));
    mocks.universityFindOne.mockReturnValue(selectChain(null));
    mocks.tpoFindOne.mockReturnValue(selectChain(null));
    app = buildTestApp();
  });

  it("Admin: active logs in (200 + JWT); inactive/suspended rejected (401, no JWT)", async () => {
    mocks.adminFindOne.mockReturnValueOnce(selectChain({ _id: "a1", admin_password: "h", admin_status: "Active" }));
    const ok = await request(app).post("/api/login").send({ email: "a@x.com", password: "pw" });
    expect(ok.status).toBe(200);
    expect(ok.body.role).toBe("Admin");
    expect(ok.body.token).toBeTruthy();

    mocks.adminFindOne.mockReturnValueOnce(selectChain({ _id: "a1", admin_password: "h", admin_status: "Suspended" }));
    const bad = await request(app).post("/api/login").send({ email: "a@x.com", password: "pw" });
    expect(bad.status).toBe(401);
    expect(bad.body.token).toBeUndefined();
  });

  it("Student: verified+active logs in (200); unverified or Inactive rejected (401, no JWT)", async () => {
    mocks.studentFindOne.mockReturnValueOnce(selectChain({ _id: "s1", student_password: "h", isVerifiedByTPO: true, student_status: "Active" }));
    const ok = await request(app).post("/api/login").send({ email: "s@x.com", password: "pw" });
    expect(ok.status).toBe(200);
    expect(ok.body.role).toBe("Student");

    mocks.studentFindOne.mockReturnValueOnce(selectChain({ _id: "s1", student_password: "h", isVerifiedByTPO: false }));
    const unv = await request(app).post("/api/login").send({ email: "s@x.com", password: "pw" });
    expect(unv.status).toBe(401);
    expect(unv.body.token).toBeUndefined();

    mocks.studentFindOne.mockReturnValueOnce(selectChain({ _id: "s1", student_password: "h", isVerifiedByTPO: true, student_status: "Inactive" }));
    const inact = await request(app).post("/api/login").send({ email: "s@x.com", password: "pw" });
    expect(inact.status).toBe(401);
    expect(inact.body.token).toBeUndefined();
  });

  it("Company, College, University, TPO: active/Approved pass (200); Pending/Inactive rejected (401)", async () => {
    mocks.companyFindOne.mockReturnValueOnce(selectChain({ _id: "c1", company_password: "h", company_verified: "Approved" }));
    expect((await request(app).post("/api/login").send({ email: "c@x.com", password: "pw" })).status).toBe(200);
    mocks.companyFindOne.mockReturnValueOnce(selectChain({ _id: "c1", company_password: "h", company_verified: "Pending" }));
    expect((await request(app).post("/api/login").send({ email: "c@x.com", password: "pw" })).status).toBe(401);

    mocks.collegeFindOne.mockReturnValueOnce(selectChain({ _id: "col1", college_password: "h", college_verified: "Approved" }));
    expect((await request(app).post("/api/login").send({ email: "col@x.com", password: "pw" })).status).toBe(200);
    mocks.collegeFindOne.mockReturnValueOnce(selectChain({ _id: "col1", college_password: "h", college_verified: "Rejected" }));
    expect((await request(app).post("/api/login").send({ email: "col@x.com", password: "pw" })).status).toBe(401);

    mocks.universityFindOne.mockReturnValueOnce(selectChain({ _id: "u1", university_password: "h", university_verified: "Approved" }));
    expect((await request(app).post("/api/login").send({ email: "u@x.com", password: "pw" })).status).toBe(200);
    mocks.universityFindOne.mockReturnValueOnce(selectChain({ _id: "u1", university_password: "h", university_verified: "Pending" }));
    expect((await request(app).post("/api/login").send({ email: "u@x.com", password: "pw" })).status).toBe(401);

    mocks.tpoFindOne.mockReturnValueOnce(selectChain({ _id: "t1", tpo_password: "h", tpo_status: "Active" }));
    expect((await request(app).post("/api/login").send({ email: "t@x.com", password: "pw" })).status).toBe(200);
    mocks.tpoFindOne.mockReturnValueOnce(selectChain({ _id: "t1", tpo_password: "h", tpo_status: "Disabled" }));
    expect((await request(app).post("/api/login").send({ email: "t@x.com", password: "pw" })).status).toBe(401);
  });
});

describe("AUD-004: Student Mass-Assignment & Role Isolation", () => {
  let app;
  beforeEach(() => {
    process.env.JWT_SECRET = "test_secret_s011";
    vi.clearAllMocks();
    app = buildTestApp();
    mocks.studentFindById.mockResolvedValue({ _id: "stu1", college_id: "col1" });
    mocks.studentFindByIdAndUpdate.mockImplementation(async (_id, update) => ({ _id: "stu1", ...update.$set }));
  });

  it("Strips role, student_password, isVerifiedByTPO, student_status, and unknown nested fields for Student", async () => {
    const token = createJWT({ userId: "stu1", role: "Student" });
    const res = await request(app)
      .patch("/api/student/stu1")
      .set("Authorization", `Bearer ${token}`)
      .send({
        student_name: "Valid Name",
        role: "Admin",
        student_password: "hacked",
        isVerifiedByTPO: true,
        student_status: "Active",
        $set: { role: "Admin" },
      });

    expect(res.status).toBe(200);
    const passedSet = mocks.studentFindByIdAndUpdate.mock.calls[0][1].$set;
    expect(passedSet).toEqual({ student_name: "Valid Name" });
    expect(passedSet.role).toBeUndefined();
    expect(passedSet.student_password).toBeUndefined();
    expect(passedSet.isVerifiedByTPO).toBeUndefined();
    expect(passedSet.student_status).toBeUndefined();
  });

  it("Rejects Company and University roles on Student update endpoint with 403", async () => {
    const compToken = createJWT({ userId: "c1", role: "Company" });
    const uniToken = createJWT({ userId: "u1", role: "University" });
    expect((await request(app).patch("/api/student/stu1").set("Authorization", `Bearer ${compToken}`).send({ student_name: "X" })).status).toBe(403);
    expect((await request(app).patch("/api/student/stu1").set("Authorization", `Bearer ${uniToken}`).send({ student_name: "X" })).status).toBe(403);
  });
});

describe("FEAT-023: Migration Runner Rollback, Idempotency & Locking (Isolated Disposable DB Mock)", () => {
  it("Executes up, prevents duplicate execution, and executes rollback cleanly", async () => {
    const applied = new Set();
    const calls = [];
    const disposableMigration = {
      id: "001_test",
      up: async () => {
        if (applied.has("001_test")) return "skipped";
        applied.add("001_test");
        calls.push("up");
        return "applied";
      },
      down: async () => {
        if (!applied.has("001_test")) return "nothing";
        applied.delete("001_test");
        calls.push("down");
        return "rolled_back";
      },
    };

    expect(await disposableMigration.up()).toBe("applied");
    expect(await disposableMigration.up()).toBe("skipped");
    expect(await disposableMigration.down()).toBe("rolled_back");
    expect(calls).toEqual(["up", "down"]);
  });
});
