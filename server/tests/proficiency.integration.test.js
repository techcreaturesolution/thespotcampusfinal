import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-proficiency";
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
const skillJsId = new mongoose.Types.ObjectId().toString();
const skillSqlId = new mongoose.Types.ObjectId().toString();

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
let userSkillDocs = [];
let studentDocs = {};
let auditDocs = [];

const setupFixtures = () => {
  skillDocs = [
    { _id: skillJsId, name: "JavaScript", normalized_name: "javascript", category: "Programming Languages", is_active: true, is_deleted: false },
    { _id: skillSqlId, name: "SQL", normalized_name: "sql", category: "Databases", is_active: true, is_deleted: false },
  ];
  userSkillDocs = [];
  studentDocs = {
    [studentId1]: { _id: studentId1, college_id: collegeId1, student_skills: "", is_deleted: false },
    [studentId2]: { _id: studentId2, college_id: collegeId2, student_skills: "", is_deleted: false },
  };
  auditDocs = [];

  tbl_student.findById = (id) => wrapQuery(studentDocs[String(id)] || null);
  tbl_student.findByIdAndUpdate = (id, update) => {
    if (studentDocs[String(id)]) {
      studentDocs[String(id)] = { ...studentDocs[String(id)], ...(update.$set || update) };
    }
    return wrapQuery(studentDocs[String(id)] || null);
  };
  tbl_skill.findOne = async (f) => skillDocs.find((s) => String(s._id) === String(f._id) && !s.is_deleted) || null;
  tbl_student_skill.countDocuments = async (f) =>
    userSkillDocs.filter((u) => String(u.student_id) === String(f.student_id) && !u.is_deleted).length;
  tbl_student_skill.find = (f) => {
    const res = userSkillDocs
      .filter((u) => String(u.student_id) === String(f.student_id) && !u.is_deleted && (!f.proficiency || u.proficiency === f.proficiency))
      .map((u) => ({ ...u, skill_id: skillDocs.find((s) => String(s._id) === String(u.skill_id)) }));
    return wrapQuery(res);
  };
  tbl_student_skill.findOne = (f) => {
    const found =
      userSkillDocs.find(
        (u) =>
          !u.is_deleted &&
          (!f._id || String(u._id) === String(f._id)) &&
          (!f.student_id || String(u.student_id) === String(f.student_id)) &&
          (!f.skill_id || String(u.skill_id) === String(f.skill_id)),
      ) || null;
    return wrapQuery(found ? { ...found, skill_id: skillDocs.find((s) => String(s._id) === String(found.skill_id)) } : null);
  };
  tbl_student_skill.findById = (id) => {
    const found = userSkillDocs.find((u) => String(u._id) === String(id)) || null;
    return wrapQuery(found ? { ...found, skill_id: skillDocs.find((s) => String(s._id) === String(found.skill_id)) } : null);
  };
  tbl_student_skill.create = async (doc) => {
    const created = { _id: new mongoose.Types.ObjectId().toString(), updatedAt: new Date(), ...doc };
    userSkillDocs.push(created);
    return created;
  };
  tbl_student_skill.findByIdAndUpdate = (id, update) => {
    const idx = userSkillDocs.findIndex((u) => String(u._id) === String(id));
    if (idx === -1) return wrapQuery(null);
    userSkillDocs[idx] = { ...userSkillDocs[idx], ...(update.$set || update) };
    const updated = userSkillDocs[idx];
    return wrapQuery({ ...updated, skill_id: skillDocs.find((s) => String(s._id) === String(updated.skill_id)) });
  };
  tbl_audit_log.create = async (doc) => {
    auditDocs.push(doc);
    return doc;
  };
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

test("Skill Proficiency Levels API integration tests", async (t) => {
  setupFixtures();
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/skills", authenticateUser, SkillsRouter);
  app.use(errorHandlerMiddleware);

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const student1Token = createJWT({ userId: studentId1, role: "Student" });
  const student2Token = createJWT({ userId: studentId2, role: "Student" });
  const college2Token = createJWT({ userId: collegeId2, role: "College" });

  // 1. Unauthenticated proficiency list -> 401; authenticated -> 200 deterministic order
  const unauthProf = await requestJson(baseUrl, "GET", "/api/skills/proficiencies");
  assert.equal(unauthProf.status, 401);

  const profRes = await requestJson(baseUrl, "GET", "/api/skills/proficiencies", { token: student1Token });
  assert.equal(profRes.status, 200);
  assert.deepEqual(
    profRes.data.proficiencies.map((p) => p.name),
    ["Beginner", "Intermediate", "Advanced", "Expert"],
  );

  // 2. Add two skills with different proficiencies
  const addJs = await requestJson(baseUrl, "POST", "/api/skills/me", {
    token: student1Token,
    body: { skill_id: skillJsId, proficiency: "Intermediate" },
  });
  assert.equal(addJs.status, 201);
  assert.equal(addJs.data.skill_entry.proficiency_details.order, 2);

  const addSql = await requestJson(baseUrl, "POST", "/api/skills/me", {
    token: student1Token,
    body: { skill_id: skillSqlId, proficiency: "Expert" },
  });
  assert.equal(addSql.status, 201);

  // 3. In-place proficiency update without duplicate record
  const updJs = await requestJson(baseUrl, "PATCH", `/api/skills/me/${addJs.data.skill_entry.id}`, {
    token: student1Token,
    body: { proficiency: "Advanced" },
  });
  assert.equal(updJs.status, 200);
  assert.equal(updJs.data.skill_entry.proficiency, "Advanced");
  assert.equal(updJs.data.skill_entry.proficiency_order, 3);
  assert.equal(userSkillDocs.length, 2);
  assert.ok(auditDocs.some((a) => a.action === "UPDATE_USER_SKILL_PROFICIENCY"));

  // 4. Filter & sort query params + invalid filter validation
  const sortedRes = await requestJson(baseUrl, "GET", "/api/skills/me?sort=proficiency_desc", {
    token: student1Token,
  });
  assert.equal(sortedRes.status, 200);
  assert.deepEqual(
    sortedRes.data.skills.map((s) => s.skill.name),
    ["SQL", "JavaScript"],
  );

  const filteredRes = await requestJson(baseUrl, "GET", "/api/skills/me?proficiency=Advanced", {
    token: student1Token,
  });
  assert.equal(filteredRes.status, 200);
  assert.equal(filteredRes.data.skills.length, 1);

  const badFilter = await requestJson(baseUrl, "GET", "/api/skills/me?proficiency=Invalid", {
    token: student1Token,
  });
  assert.equal(badFilter.status, 400);

  // 5. Cross-user & cross-college proficiency update blocked -> 403
  const crossUser = await requestJson(
    baseUrl,
    "PATCH",
    `/api/skills/student/${studentId1}/${addJs.data.skill_entry.id}`,
    { token: student2Token, body: { proficiency: "Beginner" } },
  );
  assert.equal(crossUser.status, 403);

  const crossCollege = await requestJson(
    baseUrl,
    "PATCH",
    `/api/skills/student/${studentId1}/${addJs.data.skill_entry.id}`,
    { token: college2Token, body: { proficiency: "Beginner" } },
  );
  assert.equal(crossCollege.status, 403);
});
