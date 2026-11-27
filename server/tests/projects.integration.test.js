import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-projects";
process.env.JWT_EXPIRES_IN = "1d";

const { createJWT } = await import("../src/utils/tokenUtils.js");
const { authenticateUser } = await import("../src/middleware/authMiddleware.js");
const errorHandlerMiddleware = (await import("../src/middleware/errorHandlerMiddleware.js")).default;
const ProjectsRouter = (await import("../src/modules/projects/projects.route.js")).default;

const tbl_project = (await import("../src/modules/projects/project.model.js")).default;
const tbl_project_skill = (await import("../src/modules/projects/projectSkill.model.js")).default;
const tbl_project_link = (await import("../src/modules/projects/projectLink.model.js")).default;
const tbl_skill = (await import("../src/modules/skills/skill.model.js")).default;
const tbl_student = (await import("../src/modules/student/student.model.js")).default;
const tbl_audit_log = (await import("../src/modules/audit/auditLog.model.js")).default;

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const companyId = new mongoose.Types.ObjectId().toString();
const reactSkillId = new mongoose.Types.ObjectId().toString();

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

let projectDocs = [];
let projectSkillDocs = [];
let projectLinkDocs = [];
let studentDocs = {};
let skillDocs = [];
let auditDocs = [];

const setupStubs = () => {
  projectDocs = [];
  projectSkillDocs = [];
  projectLinkDocs = [];
  skillDocs = [
    { _id: reactSkillId, name: "React", category: "Frameworks", is_active: true, is_deleted: false },
  ];
  studentDocs = {
    [studentId1]: { _id: studentId1, college_id: collegeId1, is_deleted: false },
    [studentId2]: { _id: studentId2, college_id: collegeId2, is_deleted: false },
  };
  auditDocs = [];

  tbl_student.findById = (id) => wrapQuery(studentDocs[String(id)] || null);
  tbl_skill.find = (f) => {
    const ids = (f._id?.$in || []).map(String);
    return wrapQuery(skillDocs.filter((s) => ids.includes(String(s._id)) && !s.is_deleted && s.is_active));
  };
  tbl_skill.findOne = async (f) => skillDocs.find((s) => String(s._id) === String(f._id) && !s.is_deleted) || null;
  tbl_project.countDocuments = async (f) =>
    projectDocs.filter((p) => String(p.student_id) === String(f.student_id) && !p.is_deleted).length;
  tbl_project.find = (f) =>
    wrapQuery(
      projectDocs
        .filter(
          (p) =>
            String(p.student_id) === String(f.student_id) &&
            !p.is_deleted &&
            (!f.status || p.status === f.status) &&
            (!f.visibility?.$ne || p.visibility !== f.visibility.$ne),
        )
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    );
  tbl_project.findOne = (f) => {
    const found =
      projectDocs.find(
        (p) => String(p._id) === String(f._id) && String(p.student_id) === String(f.student_id) && !p.is_deleted,
      ) || null;
    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      async save() {
        const idx = projectDocs.findIndex((x) => String(x._id) === String(this._id));
        if (idx !== -1) projectDocs[idx] = { ...projectDocs[idx], ...this };
        return this;
      },
    });
  };
  tbl_project.create = async (doc) => {
    const item = { _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date(), updatedAt: new Date(), ...doc };
    projectDocs.push(item);
    return item;
  };
  tbl_project.findByIdAndUpdate = (id, update) => {
    const idx = projectDocs.findIndex((p) => String(p._id) === String(id));
    if (idx === -1) return wrapQuery(null);
    projectDocs[idx] = { ...projectDocs[idx], ...(update.$set || update) };
    return wrapQuery(projectDocs[idx]);
  };
  tbl_project_skill.find = (f) => {
    const ids = f.project_id?.$in ? f.project_id.$in.map(String) : [String(f.project_id)];
    const res = projectSkillDocs
      .filter((ps) => ids.includes(String(ps.project_id)) && !ps.is_deleted)
      .map((ps) => ({
        ...ps,
        skill_id: skillDocs.find((s) => String(s._id) === String(ps.skill_id)),
        async save() {
          const idx = projectSkillDocs.findIndex((x) => String(x._id) === String(this._id));
          if (idx !== -1) projectSkillDocs[idx] = { ...projectSkillDocs[idx], ...this, skill_id: ps.skill_id };
          return this;
        },
      }));
    return wrapQuery(res);
  };
  tbl_project_skill.findOne = (f) => {
    const found =
      projectSkillDocs.find(
        (ps) => String(ps.project_id) === String(f.project_id) && String(ps.skill_id) === String(f.skill_id) && !ps.is_deleted,
      ) || null;
    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      async save() {
        const idx = projectSkillDocs.findIndex((x) => String(x._id) === String(this._id));
        if (idx !== -1) projectSkillDocs[idx] = { ...projectSkillDocs[idx], ...this };
        return this;
      },
    });
  };
  tbl_project_skill.create = async (doc) => {
    const item = { _id: new mongoose.Types.ObjectId().toString(), ...doc };
    projectSkillDocs.push(item);
    return item;
  };
  tbl_project_link.countDocuments = async (f) =>
    projectLinkDocs.filter((l) => String(l.project_id) === String(f.project_id) && !l.is_deleted).length;
  tbl_project_link.find = (f) => {
    const ids = f.project_id?.$in ? f.project_id.$in.map(String) : [String(f.project_id)];
    const res = projectLinkDocs
      .filter((l) => ids.includes(String(l.project_id)) && !l.is_deleted)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((l) => ({
        ...l,
        async save() {
          const idx = projectLinkDocs.findIndex((x) => String(x._id) === String(this._id));
          if (idx !== -1) projectLinkDocs[idx] = { ...projectLinkDocs[idx], ...this };
          return this;
        },
      }));
    return wrapQuery(res);
  };
  tbl_project_link.findOne = (f) => {
    const found =
      projectLinkDocs.find((l) => {
        if (l.is_deleted) return false;
        if (f._id && String(l._id) !== String(f._id)) return false;
        if (f.project_id && String(l.project_id) !== String(f.project_id)) return false;
        if (f.normalized_url && l.normalized_url !== f.normalized_url) return false;
        if (f.link_type && l.link_type !== f.link_type) return false;
        return true;
      }) || null;
    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      async save() {
        const idx = projectLinkDocs.findIndex((x) => String(x._id) === String(this._id));
        if (idx !== -1) projectLinkDocs[idx] = { ...projectLinkDocs[idx], ...this };
        return this;
      },
    });
  };
  tbl_project_link.create = async (doc) => {
    const item = { _id: new mongoose.Types.ObjectId().toString(), updatedAt: new Date(), ...doc };
    projectLinkDocs.push(item);
    return item;
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

test("Projects Management API integration tests", async (t) => {
  setupStubs();
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/projects", authenticateUser, ProjectsRouter);
  app.use(errorHandlerMiddleware);

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const student1Token = createJWT({ userId: studentId1, role: "Student" });
  const student2Token = createJWT({ userId: studentId2, role: "Student" });
  const college1Token = createJWT({ userId: collegeId1, role: "College" });
  const college2Token = createJWT({ userId: collegeId2, role: "College" });
  const companyToken = createJWT({ userId: companyId, role: "Company" });

  // 1. Unauthenticated -> 401
  const unauth = await requestJson(baseUrl, "GET", "/api/projects/me");
  assert.equal(unauth.status, 401);

  // 2. Meta -> 200
  const meta = await requestJson(baseUrl, "GET", "/api/projects/meta", { token: student1Token });
  assert.equal(meta.status, 200);
  assert.ok(meta.data.statuses.includes("Completed"));

  // 3. Unsafe URL & invalid dates -> 400
  const badUrl = await requestJson(baseUrl, "POST", "/api/projects/me", {
    token: student1Token,
    body: {
      title: "Unsafe Link Project",
      description: "Valid description with more than ten chars",
      repository_url: "javascript:alert(1)",
    },
  });
  assert.equal(badUrl.status, 400);

  // 4. Valid project creation -> 201
  const created = await requestJson(baseUrl, "POST", "/api/projects/me", {
    token: student1Token,
    body: {
      title: "AI Campus Assistant",
      description: "Built an AI-powered placement and exam helper",
      role: "Full Stack Developer",
      status: "Completed",
      visibility: "Private",
      repository_url: "https://github.com/prachi/ai-campus",
      skill_ids: [reactSkillId],
    },
  });
  assert.equal(created.status, 201);
  const projectId = created.data.project.id;
  assert.equal(created.data.project.skills.length, 1);

  // 5. Private project hidden from College -> 200 empty / 403 direct
  const colList = await requestJson(baseUrl, "GET", `/api/projects/student/${studentId1}`, {
    token: college1Token,
  });
  assert.equal(colList.status, 200);
  assert.equal(colList.data.projects.length, 0);

  // 6. Update visibility to Public -> College can see it
  const upd = await requestJson(baseUrl, "PATCH", `/api/projects/me/${projectId}`, {
    token: student1Token,
    body: { visibility: "Public" },
  });
  assert.equal(upd.status, 200);

  const colListPublic = await requestJson(baseUrl, "GET", `/api/projects/student/${studentId1}`, {
    token: college1Token,
  });
  assert.equal(colListPublic.status, 200);
  assert.equal(colListPublic.data.projects.length, 1);

  // 7. IDOR, cross-college, Company denied -> 403
  const idor = await requestJson(baseUrl, "GET", `/api/projects/student/${studentId1}/${projectId}`, {
    token: student2Token,
  });
  assert.equal(idor.status, 403);

  const crossCollege = await requestJson(baseUrl, "GET", `/api/projects/student/${studentId1}`, {
    token: college2Token,
  });
  assert.equal(crossCollege.status, 403);

  const compRes = await requestJson(baseUrl, "GET", `/api/projects/student/${studentId1}`, {
    token: companyToken,
  });
  assert.equal(compRes.status, 403);

  // 8. Reorder & Delete -> 200
  const reorder = await requestJson(baseUrl, "PATCH", "/api/projects/me/reorder", {
    token: student1Token,
    body: { orders: [{ project_id: projectId, display_order: 0 }] },
  });
  assert.equal(reorder.status, 200);

  const del = await requestJson(baseUrl, "DELETE", `/api/projects/me/${projectId}`, {
    token: student1Token,
  });
  assert.equal(del.status, 200);
  assert.ok(auditDocs.length >= 3);
});
