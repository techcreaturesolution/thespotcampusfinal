import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-skills";
process.env.JWT_EXPIRES_IN = "1d";

const { createJWT } = await import("../src/utils/tokenUtils.js");
const { authenticateUser } = await import("../src/middleware/authMiddleware.js");
const errorHandlerMiddleware = (await import("../src/middleware/errorHandlerMiddleware.js")).default;
const SkillsRouter = (await import("../src/modules/skills/skills.route.js")).default;

const tbl_skill = (await import("../src/modules/skills/skill.model.js")).default;
const tbl_student_skill = (await import("../src/modules/skills/studentSkill.model.js")).default;
const tbl_student = (await import("../src/modules/student/student.model.js")).default;
const tbl_audit_log = (await import("../src/modules/audit/auditLog.model.js")).default;

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const adminId = new mongoose.Types.ObjectId().toString();
const companyId = new mongoose.Types.ObjectId().toString();
const reactSkillId = new mongoose.Types.ObjectId().toString();
const inactiveSkillId = new mongoose.Types.ObjectId().toString();

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

let skillDocs = [];
let studentSkillDocs = [];
let studentDocs = {};
let auditDocs = [];

const resetStore = () => {
  skillDocs = [
    {
      _id: reactSkillId,
      name: "React",
      normalized_name: "react",
      category: "Frameworks",
      is_active: true,
      is_deleted: false,
    },
    {
      _id: inactiveSkillId,
      name: "LegacyCobol",
      normalized_name: "legacycobol",
      category: "Other",
      is_active: false,
      is_deleted: false,
    },
  ];
  studentSkillDocs = [];
  studentDocs = {
    [studentId1]: {
      _id: studentId1,
      college_id: collegeId1,
      student_skills: "",
      is_deleted: false,
    },
    [studentId2]: {
      _id: studentId2,
      college_id: collegeId2,
      student_skills: "",
      is_deleted: false,
    },
  };
  auditDocs = [];
};

const setupStubs = () => {
  tbl_student.findById = (id) => wrapQuery(studentDocs[String(id)] || null);
  tbl_student.findByIdAndUpdate = (id, update) => {
    if (studentDocs[String(id)]) {
      studentDocs[String(id)] = { ...studentDocs[String(id)], ...(update.$set || update) };
    }
    return wrapQuery(studentDocs[String(id)] || null);
  };

  tbl_skill.countDocuments = async (filter) =>
    skillDocs.filter((s) => !s.is_deleted && (filter?.is_active === undefined || s.is_active === filter.is_active))
      .length;
  tbl_skill.find = (filter) => {
    const res = skillDocs.filter((s) => {
      if (filter?.is_deleted === false && s.is_deleted) return false;
      if (filter?.is_active === true && !s.is_active) return false;
      if (filter?.category && s.category !== filter.category) return false;
      if (filter?.$or) {
        const regex = filter.$or[0]?.normalized_name;
        if (regex && !regex.test(s.normalized_name) && !regex.test(s.name)) return false;
      }
      return true;
    });
    return wrapQuery(res);
  };
  tbl_skill.findOne = async (filter) =>
    skillDocs.find((s) => {
      if (filter._id && String(s._id) !== String(filter._id)) return false;
      if (filter.normalized_name && s.normalized_name !== filter.normalized_name) return false;
      if (filter.is_deleted === false && s.is_deleted) return false;
      return true;
    }) || null;
  tbl_skill.create = async (doc) => {
    const item = { _id: new mongoose.Types.ObjectId().toString(), ...doc };
    skillDocs.push(item);
    return item;
  };

  tbl_student_skill.countDocuments = async (filter) =>
    studentSkillDocs.filter((u) => String(u.student_id) === String(filter.student_id) && !u.is_deleted).length;
  tbl_student_skill.find = (filter) => {
    const list = studentSkillDocs
      .filter((u) => String(u.student_id) === String(filter.student_id) && !u.is_deleted)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((u) => ({
        ...u,
        skill_id: skillDocs.find((s) => String(s._id) === String(u.skill_id)) || u.skill_id,
      }));
    return wrapQuery(list);
  };
  tbl_student_skill.findOne = (filter) => {
    const found =
      studentSkillDocs.find((u) => {
        if (filter._id && String(u._id) !== String(filter._id)) return false;
        if (filter.student_id && String(u.student_id) !== String(filter.student_id)) return false;
        if (filter.skill_id && String(u.skill_id) !== String(filter.skill_id)) return false;
        if (filter.is_deleted === false && u.is_deleted) return false;
        return true;
      }) || null;
    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      skill_id: skillDocs.find((s) => String(s._id) === String(found.skill_id)) || found.skill_id,
      async save() {
        const idx = studentSkillDocs.findIndex((x) => String(x._id) === String(this._id));
        if (idx !== -1) studentSkillDocs[idx] = { ...studentSkillDocs[idx], ...this, skill_id: found.skill_id };
        return this;
      },
    });
  };
  tbl_student_skill.findById = (id) => {
    const found = studentSkillDocs.find((u) => String(u._id) === String(id)) || null;
    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      skill_id: skillDocs.find((s) => String(s._id) === String(found.skill_id)) || found.skill_id,
    });
  };
  tbl_student_skill.create = async (doc) => {
    const item = { _id: new mongoose.Types.ObjectId().toString(), updatedAt: new Date(), ...doc };
    studentSkillDocs.push(item);
    return item;
  };
  tbl_student_skill.findByIdAndUpdate = (id, update) => {
    const idx = studentSkillDocs.findIndex((u) => String(u._id) === String(id));
    if (idx === -1) return wrapQuery(null);
    studentSkillDocs[idx] = { ...studentSkillDocs[idx], ...(update.$set || update) };
    const updated = studentSkillDocs[idx];
    return wrapQuery({
      ...updated,
      skill_id: skillDocs.find((s) => String(s._id) === String(updated.skill_id)) || updated.skill_id,
    });
  };

  tbl_audit_log.create = async (doc) => {
    auditDocs.push(doc);
    return doc;
  };
};

const buildApp = () => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/skills", authenticateUser, SkillsRouter);
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

test("Technical Skills API integration tests", async (t) => {
  resetStore();
  setupStubs();
  const app = buildApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => new Promise((resolve) => server.close(resolve)));

  const student1Token = createJWT({ userId: studentId1, role: "Student" });
  const college2Token = createJWT({ userId: collegeId2, role: "College" });
  const adminToken = createJWT({ userId: adminId, role: "Admin" });
  const companyToken = createJWT({ userId: companyId, role: "Company" });

  // 1. Unauthenticated -> 401
  const unauth = await requestJson(baseUrl, "GET", "/api/skills/me");
  assert.equal(unauth.status, 401);

  // 2. Search canonical skills -> 200
  const searchRes = await requestJson(baseUrl, "GET", "/api/skills/master?q=react", {
    token: student1Token,
  });
  assert.equal(searchRes.status, 200);
  assert.equal(searchRes.data.skills.length, 1);
  assert.equal(searchRes.data.skills[0].name, "React");

  // 3. Student cannot create canonical skill -> 403; Admin can -> 201; duplicate -> 400
  const studentCreateMaster = await requestJson(baseUrl, "POST", "/api/skills/master", {
    token: student1Token,
    body: { name: "TypeScript", category: "Programming Languages" },
  });
  assert.equal(studentCreateMaster.status, 403);

  const adminCreateMaster = await requestJson(baseUrl, "POST", "/api/skills/master", {
    token: adminToken,
    body: { name: "TypeScript", category: "Programming Languages" },
  });
  assert.equal(adminCreateMaster.status, 201);

  const dupMaster = await requestJson(baseUrl, "POST", "/api/skills/master", {
    token: adminToken,
    body: { name: "  TYPESCRIPT ", category: "Programming Languages" },
  });
  assert.equal(dupMaster.status, 400);

  // 4. Add inactive skill -> 400; invalid proficiency -> 400; invalid ID -> 400
  const inactiveRes = await requestJson(baseUrl, "POST", "/api/skills/me", {
    token: student1Token,
    body: { skill_id: inactiveSkillId, proficiency: "Beginner" },
  });
  assert.equal(inactiveRes.status, 400);

  const badProf = await requestJson(baseUrl, "POST", "/api/skills/me", {
    token: student1Token,
    body: { skill_id: reactSkillId, proficiency: "Master" },
  });
  assert.equal(badProf.status, 400);

  // 5. Add valid skill -> 201; duplicate -> 400
  const addOk = await requestJson(baseUrl, "POST", "/api/skills/me", {
    token: student1Token,
    body: { skill_id: reactSkillId, proficiency: "Intermediate", years_of_experience: 1 },
  });
  assert.equal(addOk.status, 201);
  const userSkillId = addOk.data.skill_entry.id;

  const dupUserSkill = await requestJson(baseUrl, "POST", "/api/skills/me", {
    token: student1Token,
    body: { skill_id: reactSkillId, proficiency: "Advanced" },
  });
  assert.equal(dupUserSkill.status, 400);

  // 6. Update & reorder & delete
  const updRes = await requestJson(baseUrl, "PATCH", `/api/skills/me/${userSkillId}`, {
    token: student1Token,
    body: { proficiency: "Advanced", years_of_experience: 2 },
  });
  assert.equal(updRes.status, 200);
  assert.equal(updRes.data.skill_entry.proficiency, "Advanced");

  const reorderRes = await requestJson(baseUrl, "PATCH", "/api/skills/me/reorder", {
    token: student1Token,
    body: { orders: [{ user_skill_id: userSkillId, display_order: 0 }] },
  });
  assert.equal(reorderRes.status, 200);

  // 7. IDOR & cross-college & Company denied -> 403
  const idorRes = await requestJson(baseUrl, "GET", `/api/skills/student/${studentId2}`, {
    token: student1Token,
  });
  assert.equal(idorRes.status, 403);

  const crossCollegeRes = await requestJson(baseUrl, "GET", `/api/skills/student/${studentId1}`, {
    token: college2Token,
  });
  assert.equal(crossCollegeRes.status, 403);

  const companyRes = await requestJson(baseUrl, "GET", `/api/skills/student/${studentId1}`, {
    token: companyToken,
  });
  assert.equal(companyRes.status, 403);

  const delRes = await requestJson(baseUrl, "DELETE", `/api/skills/me/${userSkillId}`, {
    token: student1Token,
  });
  assert.equal(delRes.status, 200);
  assert.ok(auditDocs.length >= 4);
});
