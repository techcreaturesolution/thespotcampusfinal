import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-internships";
process.env.JWT_EXPIRES_IN = "1d";

const { createJWT } = await import("../src/utils/tokenUtils.js");
const { authenticateUser } = await import("../src/middleware/authMiddleware.js");
const errorHandlerMiddleware = (await import("../src/middleware/errorHandlerMiddleware.js")).default;
const InternshipsRouter = (await import("../src/modules/internships/internship.route.js")).default;

const tbl_internship = (await import("../src/modules/internships/internship.model.js")).default;
const tbl_skill = (await import("../src/modules/skills/skill.model.js")).default;
const tbl_project = (await import("../src/modules/projects/project.model.js")).default;
const tbl_student = (await import("../src/modules/student/student.model.js")).default;
const tbl_audit_log = (await import("../src/modules/audit/auditLog.model.js")).default;

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const companyId = new mongoose.Types.ObjectId().toString();
const skillId = new mongoose.Types.ObjectId().toString();
const proj1Id = new mongoose.Types.ObjectId().toString();
const proj2Id = new mongoose.Types.ObjectId().toString();

const wrapQuery = (value) => {
  const q = {
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

let internshipDocs = [];
let skillDocs = [];
let projectDocs = [];
let studentDocs = {};
let auditDocs = [];

const setupStubs = () => {
  internshipDocs = [];
  skillDocs = [
    { _id: skillId, name: "React", category: "Frameworks", is_active: true, is_deleted: false },
  ];
  projectDocs = [
    {
      _id: proj1Id,
      student_id: studentId1,
      title: "Student1 Private App",
      status: "Completed",
      visibility: "Private",
      is_deleted: false,
    },
    {
      _id: proj2Id,
      student_id: studentId2,
      title: "Student2 Secret App",
      status: "Completed",
      visibility: "Private",
      is_deleted: false,
    },
  ];
  studentDocs = {
    [studentId1]: {
      _id: studentId1,
      college_id: collegeId1,
      university_id: uniId,
      is_deleted: false,
    },
    [studentId2]: {
      _id: studentId2,
      college_id: collegeId2,
      university_id: uniId,
      is_deleted: false,
    },
  };
  auditDocs = [];

  tbl_student.findById = (id) => wrapQuery(studentDocs[String(id)] || null);
  tbl_skill.find = (f) => {
    const ids = (f._id?.$in || []).map(String);
    return wrapQuery(skillDocs.filter((s) => ids.includes(String(s._id)) && !s.is_deleted));
  };
  tbl_project.find = (f) => {
    const ids = (f._id?.$in || []).map(String);
    return wrapQuery(
      projectDocs.filter(
        (p) =>
          ids.includes(String(p._id)) &&
          String(p.student_id) === String(f.student_id) &&
          !p.is_deleted,
      ),
    );
  };
  tbl_internship.countDocuments = async (f) =>
    internshipDocs.filter(
      (i) =>
        String(i.student_id) === String(f.student_id) &&
        !i.is_deleted &&
        (!f.visibility?.$ne || i.visibility !== f.visibility.$ne),
    ).length;
  tbl_internship.find = (f) =>
    wrapQuery(
      internshipDocs
        .filter(
          (i) =>
            String(i.student_id) === String(f.student_id) &&
            !i.is_deleted &&
            (!f.visibility?.$ne || i.visibility !== f.visibility.$ne),
        )
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    );
  tbl_internship.findOne = (f) => {
    const found =
      internshipDocs.find((i) => {
        if (i.is_deleted) return false;
        if (f._id && typeof f._id === "string" && String(i._id) !== String(f._id)) return false;
        if (f._id?.$ne && String(i._id) === String(f._id.$ne)) return false;
        if (f.student_id && String(i.student_id) !== String(f.student_id)) return false;
        if (f.normalized_organization && i.normalized_organization !== f.normalized_organization)
          return false;
        if (f.normalized_role && i.normalized_role !== f.normalized_role) return false;
        if (f.start_date && new Date(i.start_date).getTime() !== new Date(f.start_date).getTime())
          return false;
        if (f.currently_working !== undefined && i.currently_working !== f.currently_working)
          return false;
        return true;
      }) || null;
    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      async save() {
        const idx = internshipDocs.findIndex((x) => String(x._id) === String(this._id));
        if (idx !== -1) internshipDocs[idx] = { ...internshipDocs[idx], ...this };
        return this;
      },
    });
  };
  tbl_internship.create = async (doc) => {
    const item = {
      _id: new mongoose.Types.ObjectId().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...doc,
    };
    internshipDocs.push(item);
    return item;
  };
  tbl_internship.findByIdAndUpdate = (id, update) => {
    const idx = internshipDocs.findIndex((i) => String(i._id) === String(id));
    if (idx === -1) return wrapQuery(null);
    internshipDocs[idx] = { ...internshipDocs[idx], ...(update.$set || update) };
    return wrapQuery(internshipDocs[idx]);
  };
  tbl_audit_log.create = async (doc) => {
    auditDocs.push(doc);
    return doc;
  };
};

const requestJson = (baseUrl, method, reqPath, { token, body } = {}) =>
  new Promise((resolve, reject) => {
    const req = http.request(
      `${baseUrl}${reqPath}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => {
          raw += c;
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
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });

test("Internship Experience API & security regression tests", async (t) => {
  setupStubs();
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/internships", authenticateUser, InternshipsRouter);
  app.use(errorHandlerMiddleware);

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const student1Token = createJWT({ userId: studentId1, role: "Student" });
  const student2Token = createJWT({ userId: studentId2, role: "Student" });
  const college1Token = createJWT({ userId: collegeId1, role: "College" });
  const college2Token = createJWT({ userId: collegeId2, role: "College" });
  const uniToken = createJWT({ userId: uniId, role: "University" });
  const companyToken = createJWT({ userId: companyId, role: "Company" });

  // 1. Unauthenticated -> 401
  assert.equal((await requestJson(baseUrl, "GET", "/api/internships/me")).status, 401);

  // 2. Reject invalid dates & unsafe URL -> 400
  const badUrl = await requestJson(baseUrl, "POST", "/api/internships/me", {
    token: student1Token,
    body: {
      role_title: "SWE Intern",
      organization_name: "Acme",
      start_date: "2025-01-01",
      currently_working: true,
      company_website: "javascript:alert(1)",
    },
  });
  assert.equal(badUrl.status, 400);

  // 3. Reject cross-user project linking -> 400
  const badRel = await requestJson(baseUrl, "POST", "/api/internships/me", {
    token: student1Token,
    body: {
      role_title: "SWE Intern",
      organization_name: "Acme",
      start_date: "2025-01-01",
      currently_working: true,
      project_ids: [proj2Id],
    },
  });
  assert.equal(badRel.status, 400);

  // 4. Valid Private creation -> 201
  const created = await requestJson(baseUrl, "POST", "/api/internships/me", {
    token: student1Token,
    body: {
      role_title: "Software Engineering Intern",
      organization_name: "Tech Creature Solution",
      work_mode: "Remote",
      start_date: "2025-01-01",
      currently_working: true,
      skill_ids: [skillId],
      project_ids: [proj1Id],
      visibility: "Private",
    },
  });
  assert.equal(created.status, 201);
  const internshipId = created.data.internship.id;

  // 5. Security Regression: Student2 IDOR across GET, PATCH, DELETE -> 403
  assert.equal(
    (
      await requestJson(baseUrl, "GET", `/api/internships/student/${studentId1}/${internshipId}`, {
        token: student2Token,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestJson(baseUrl, "PATCH", `/api/internships/student/${studentId1}/${internshipId}`, {
        token: student2Token,
        body: { role_title: "Hijack" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestJson(baseUrl, "DELETE", `/api/internships/student/${studentId1}/${internshipId}`, {
        token: student2Token,
      })
    ).status,
    403,
  );

  // 6. Private visibility hidden from College1; when switched to Public, Private project remains hidden
  const colPriv = await requestJson(baseUrl, "GET", `/api/internships/student/${studentId1}`, {
    token: college1Token,
  });
  assert.equal(colPriv.status, 200);
  assert.equal(colPriv.data.internships.length, 0);

  const makePublic = await requestJson(baseUrl, "PATCH", `/api/internships/me/${internshipId}`, {
    token: student1Token,
    body: { visibility: "Public" },
  });
  assert.equal(makePublic.status, 200);

  const colPub = await requestJson(baseUrl, "GET", `/api/internships/student/${studentId1}`, {
    token: college1Token,
  });
  assert.equal(colPub.status, 200);
  assert.equal(colPub.data.internships.length, 1);
  assert.equal(colPub.data.internships[0].projects.length, 0);

  // 7. Cross-institute, Company, University write denied -> 403
  assert.equal(
    (
      await requestJson(baseUrl, "GET", `/api/internships/student/${studentId1}`, {
        token: college2Token,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestJson(baseUrl, "GET", `/api/internships/student/${studentId1}`, {
        token: companyToken,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestJson(baseUrl, "PATCH", `/api/internships/student/${studentId1}/${internshipId}`, {
        token: uniToken,
        body: { role_title: "Uni Change" },
      })
    ).status,
    403,
  );

  // 8. Reorder & Delete -> 200
  const reorder = await requestJson(baseUrl, "PATCH", "/api/internships/me/reorder", {
    token: student1Token,
    body: { orders: [{ internship_id: internshipId, display_order: 0 }] },
  });
  assert.equal(reorder.status, 200);

  const del = await requestJson(baseUrl, "DELETE", `/api/internships/me/${internshipId}`, {
    token: student1Token,
  });
  assert.equal(del.status, 200);
  assert.ok(auditDocs.length >= 3);
});
