import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-academic-profile";
process.env.JWT_EXPIRES_IN = "1d";

const { createJWT } = await import("../src/utils/tokenUtils.js");
const { authenticateUser } = await import("../src/middleware/authMiddleware.js");
const errorHandlerMiddleware = (await import("../src/middleware/errorHandlerMiddleware.js")).default;
const AcademicProfileRouter = (await import("../src/modules/academicProfile/academicProfile.route.js")).default;
const StudentRouter = (await import("../src/modules/student/student.route.js")).default;
const userRouter = (await import("../src/modules/auth/user.route.js")).default;

const tbl_student = (await import("../src/modules/student/student.model.js")).default;
const tbl_tpo = (await import("../src/modules/tpo/tpo.model.js")).default;
const tbl_college = (await import("../src/modules/college/college.model.js")).default;
const tbl_university = (await import("../src/modules/university/university.model.js")).default;
const tbl_degree = (await import("../src/modules/degree/degree.model.js")).default;
const tbl_branch = (await import("../src/modules/branch/branch.model.js")).default;
const tbl_academic_history = (await import("../src/modules/academicProfile/academicHistory.model.js")).default;
const tbl_audit_log = (await import("../src/modules/audit/auditLog.model.js")).default;

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const degreeId = new mongoose.Types.ObjectId().toString();
const branchId = new mongoose.Types.ObjectId().toString();
const tpoId = new mongoose.Types.ObjectId().toString();
const companyId = new mongoose.Types.ObjectId().toString();

const wrapQuery = (value) => {
  const q = {
    populate() {
      return q;
    },
    sort() {
      return q;
    },
    skip() {
      return q;
    },
    limit() {
      return q;
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
  return q;
};

let studentStore = {};
let historyStore = [];
let auditStore = [];

const resetFixtures = () => {
  studentStore = {
    [studentId1]: {
      _id: studentId1,
      student_name: "Student One",
      student_email: "one@example.com",
      university_id: { _id: uniId, university_name: "GTU" },
      college_id: { _id: collegeId1, college_name: "College One", college_university_id: uniId },
      degree_id: { _id: degreeId, degree_name: "B.E.", degree_sem: "8", college_id: collegeId1 },
      branch_id: { _id: branchId, branch_name: "CSE", degree_id: degreeId, college_id: collegeId1 },
      student_enrollment: "EN001",
      student_current_sem: "5",
      student_total_backlog: "0",
      academic_year: "2025-26",
      academic_batch: "2022-2026",
      academic_status: "Active",
      cgpa: 8.4,
      isVerifiedByTPO: true,
      academic_profile_initialized: true,
      is_deleted: false,
      toJSON() {
        return { ...this };
      },
    },
    [studentId2]: {
      _id: studentId2,
      student_name: "Student Two",
      student_email: "two@example.com",
      university_id: { _id: uniId, university_name: "GTU" },
      college_id: { _id: collegeId2, college_name: "College Two", college_university_id: uniId },
      degree_id: null,
      branch_id: null,
      student_enrollment: "EN002",
      isVerifiedByTPO: false,
      is_deleted: false,
      toJSON() {
        return { ...this };
      },
    },
  };
  historyStore = [];
  auditStore = [];
};

// Stub Mongoose methods cleanly for offline Express HTTP integration tests
tbl_student.findById = (id) => wrapQuery(studentStore[String(id)] || null);
tbl_student.findOne = () => wrapQuery(null);
tbl_student.findByIdAndUpdate = (id, update) => {
  const existing = studentStore[String(id)];
  if (!existing) return wrapQuery(null);
  const next = {
    ...existing,
    ...(update.$set || update),
    toJSON() {
      return { ...this };
    },
  };
  studentStore[String(id)] = next;
  return wrapQuery(next);
};
tbl_tpo.findById = () => wrapQuery({ _id: tpoId, tpo_college_id: collegeId1, tpo_degree_id: degreeId });
tbl_university.findById = (id) => wrapQuery(String(id) === uniId ? { _id: uniId } : null);
tbl_college.findById = (id) =>
  wrapQuery(String(id) === collegeId1 ? { _id: collegeId1, college_university_id: uniId } : null);
tbl_degree.findById = (id) =>
  wrapQuery(String(id) === degreeId ? { _id: degreeId, college_id: collegeId1, degree_sem: "8" } : null);
tbl_branch.findById = (id) =>
  wrapQuery(String(id) === branchId ? { _id: branchId, degree_id: degreeId, college_id: collegeId1 } : null);

tbl_academic_history.countDocuments = async (filter) =>
  historyStore.filter((h) => String(h.student_id) === String(filter.student_id) && !h.is_deleted).length;
tbl_academic_history.find = (filter) =>
  wrapQuery(historyStore.filter((h) => String(h.student_id) === String(filter.student_id) && !h.is_deleted));
tbl_academic_history.findOne = async (filter) => {
  if (filter._id) {
    return (
      historyStore.find(
        (h) =>
          String(h._id) === String(filter._id) &&
          String(h.student_id) === String(filter.student_id) &&
          !h.is_deleted,
      ) || null
    );
  }
  return null;
};
tbl_academic_history.create = async (doc) => {
  const entry = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...doc,
    async save() {
      return this;
    },
  };
  historyStore.push(entry);
  return entry;
};
tbl_academic_history.findByIdAndUpdate = async (id, update) => {
  const idx = historyStore.findIndex((h) => String(h._id) === String(id));
  if (idx === -1) return null;
  historyStore[idx] = { ...historyStore[idx], ...(update.$set || update) };
  return historyStore[idx];
};
tbl_audit_log.create = async (doc) => {
  const log = { _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date(), ...doc };
  auditStore.push(log);
  return log;
};
tbl_audit_log.find = (filter) =>
  wrapQuery(auditStore.filter((l) => String(l.target_user_id) === String(filter.target_user_id)));
tbl_audit_log.countDocuments = async (filter) =>
  auditStore.filter((l) => String(l.target_user_id) === String(filter.target_user_id)).length;

const buildTestApp = () => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/academic-profile", authenticateUser, AcademicProfileRouter);
  app.use("/api/student", authenticateUser, StudentRouter);
  app.use("/api/users", authenticateUser, userRouter);
  app.use(errorHandlerMiddleware);
  return app;
};

const requestJson = (baseUrl, method, path, { token, body } = {}) =>
  new Promise((resolve, reject) => {
    const req = http.request(
      `${baseUrl}${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: raw ? JSON.parse(raw) : {} });
          } catch {
            resolve({ status: res.statusCode, data: raw });
          }
        });
      },
    );
    req.on("error", reject);
    if (body !== undefined) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });

test("Academic Profile API integration tests", async (t) => {
  resetFixtures();
  const app = buildTestApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => new Promise((resolve) => server.close(resolve)));

  const student1Token = createJWT({ userId: studentId1, role: "Student" });
  const college1Token = createJWT({ userId: collegeId1, role: "College" });
  const college2Token = createJWT({ userId: collegeId2, role: "College" });
  const companyToken = createJWT({ userId: companyId, role: "Company" });

  // 1. Unauthenticated request -> 401
  const unauth = await requestJson(baseUrl, "GET", "/api/academic-profile/me");
  assert.equal(unauth.status, 401);

  // 2. Authenticated student reads own profile -> 200
  const myProfile = await requestJson(baseUrl, "GET", "/api/academic-profile/me", {
    token: student1Token,
  });
  assert.equal(myProfile.status, 200);
  assert.equal(myProfile.data.academic_profile.student_enrollment, "EN001");
  assert.equal(myProfile.data.completion.percentage, 90);

  // 3. IDOR check: student1 accessing student2 -> 403
  const idor = await requestJson(baseUrl, "GET", `/api/academic-profile/student/${studentId2}`, {
    token: student1Token,
  });
  assert.equal(idor.status, 403);

  // 4. Company role denied -> 403
  const companyRes = await requestJson(
    baseUrl,
    "GET",
    `/api/academic-profile/student/${studentId1}`,
    { token: companyToken },
  );
  assert.equal(companyRes.status, 403);

  // 5. Cross-college access denied -> 403
  const crossCollege = await requestJson(
    baseUrl,
    "GET",
    `/api/academic-profile/student/${studentId1}`,
    { token: college2Token },
  );
  assert.equal(crossCollege.status, 403);

  // 6. Invalid ID format -> 400
  const badId = await requestJson(baseUrl, "GET", "/api/academic-profile/student/not-an-id", {
    token: college1Token,
  });
  assert.equal(badId.status, 400);

  // 7. Malformed academic year / CGPA -> 400
  const badPatch = await requestJson(baseUrl, "PATCH", "/api/academic-profile/me", {
    token: student1Token,
    body: { academic_year: "bad-format", cgpa: 15 },
  });
  assert.equal(badPatch.status, 400);

  // 8. Verified student trying to forge isVerifiedByTPO -> 403
  const massAssign = await requestJson(baseUrl, "PATCH", "/api/academic-profile/me", {
    token: student1Token,
    body: { isVerifiedByTPO: false },
  });
  assert.equal(massAssign.status, 403);

  // 9. Valid progress update + history CRUD + audit logs
  const validPatch = await requestJson(baseUrl, "PATCH", "/api/academic-profile/me", {
    token: student1Token,
    body: { student_current_sem: "6", cgpa: 8.75 },
  });
  assert.equal(validPatch.status, 200);
  assert.equal(validPatch.data.academic_profile.student_current_sem, "6");

  const addHist = await requestJson(baseUrl, "POST", "/api/academic-profile/me/history", {
    token: student1Token,
    body: {
      stage_type: "12th",
      institution_name: "St. Xavier School",
      start_year: 2020,
      end_year: 2022,
      score_type: "Percentage",
      score_value: "91.2",
    },
  });
  assert.equal(addHist.status, 201);
  assert.equal(addHist.data.completion.percentage, 100);

  const histId = addHist.data.entry._id;
  const updHist = await requestJson(
    baseUrl,
    "PATCH",
    `/api/academic-profile/me/history/${histId}`,
    {
      token: student1Token,
      body: { score_value: "92.0" },
    },
  );
  assert.equal(updHist.status, 200);
  assert.equal(updHist.data.entry.score_value, "92.0");

  const delHist = await requestJson(
    baseUrl,
    "DELETE",
    `/api/academic-profile/me/history/${histId}`,
    { token: student1Token },
  );
  assert.equal(delHist.status, 200);
  assert.equal(delHist.data.completion.percentage, 90);

  const logsRes = await requestJson(
    baseUrl,
    "GET",
    `/api/academic-profile/student/${studentId1}/audit-logs`,
    { token: college1Token },
  );
  assert.equal(logsRes.status, 200);
  assert.ok(logsRes.data.logs.length >= 3);

  // 10. Regression security checks on /api/users/update-profile and /api/student/:id
  const userProfileMassAssign = await requestJson(baseUrl, "PATCH", "/api/users/update-profile", {
    token: student1Token,
    body: { student_name: "Updated Name", isVerifiedByTPO: false, role: "Admin" },
  });
  assert.equal(userProfileMassAssign.status, 200);
  assert.equal(studentStore[studentId1].isVerifiedByTPO, true);
  assert.equal(studentStore[studentId1].role, undefined);

  const studentIdor = await requestJson(baseUrl, "GET", `/api/student/${studentId2}`, {
    token: student1Token,
  });
  assert.equal(studentIdor.status, 403);
});
