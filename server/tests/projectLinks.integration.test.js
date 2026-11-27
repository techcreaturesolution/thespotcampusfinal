import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-project-links";
process.env.JWT_EXPIRES_IN = "1d";

const { createJWT } = await import("../src/utils/tokenUtils.js");
const { authenticateUser } = await import("../src/middleware/authMiddleware.js");
const errorHandlerMiddleware = (await import("../src/middleware/errorHandlerMiddleware.js")).default;
const ProjectsRouter = (await import("../src/modules/projects/projects.route.js")).default;

const tbl_project = (await import("../src/modules/projects/project.model.js")).default;
const tbl_project_skill = (await import("../src/modules/projects/projectSkill.model.js")).default;
const tbl_project_link = (await import("../src/modules/projects/projectLink.model.js")).default;
const tbl_student = (await import("../src/modules/student/student.model.js")).default;
const tbl_audit_log = (await import("../src/modules/audit/auditLog.model.js")).default;

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const projectId1 = new mongoose.Types.ObjectId().toString();

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
let linkDocs = [];
let studentDocs = {};
let auditDocs = [];

const setupStubs = () => {
  projectDocs = [
    {
      _id: projectId1,
      student_id: studentId1,
      college_id: collegeId1,
      title: "Spot Campus Web",
      description: "Full stack placement web platform",
      status: "Completed",
      visibility: "Private",
      is_deleted: false,
    },
  ];
  linkDocs = [];
  studentDocs = {
    [studentId1]: { _id: studentId1, college_id: collegeId1, is_deleted: false },
    [studentId2]: { _id: studentId2, college_id: collegeId2, is_deleted: false },
  };
  auditDocs = [];

  tbl_student.findById = (id) => wrapQuery(studentDocs[String(id)] || null);
  tbl_project_skill.find = () => wrapQuery([]);
  tbl_project.findOne = (f) =>
    wrapQuery(
      projectDocs.find(
        (p) => String(p._id) === String(f._id) && String(p.student_id) === String(f.student_id) && !p.is_deleted,
      ) || null,
    );
  tbl_project.findByIdAndUpdate = (id, update) => {
    const idx = projectDocs.findIndex((p) => String(p._id) === String(id));
    if (idx === -1) return wrapQuery(null);
    projectDocs[idx] = { ...projectDocs[idx], ...(update.$set || update) };
    return wrapQuery(projectDocs[idx]);
  };

  tbl_project_link.countDocuments = async (f) =>
    linkDocs.filter((l) => String(l.project_id) === String(f.project_id) && !l.is_deleted).length;
  tbl_project_link.find = (f) => {
    const ids = f.project_id?.$in ? f.project_id.$in.map(String) : [String(f.project_id)];
    const res = linkDocs
      .filter((l) => ids.includes(String(l.project_id)) && !l.is_deleted)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return wrapQuery(res);
  };
  tbl_project_link.findOne = (f) => {
    const found =
      linkDocs.find((l) => {
        if (l.is_deleted) return false;
        if (f._id && typeof f._id === "string" && String(l._id) !== String(f._id)) return false;
        if (f._id?.$ne && String(l._id) === String(f._id.$ne)) return false;
        if (f.project_id && String(l.project_id) !== String(f.project_id)) return false;
        if (f.normalized_url && l.normalized_url !== f.normalized_url) return false;
        if (f.link_type && l.link_type !== f.link_type) return false;
        return true;
      }) || null;
    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      async save() {
        const idx = linkDocs.findIndex((x) => String(x._id) === String(this._id));
        if (idx !== -1) linkDocs[idx] = { ...linkDocs[idx], ...this };
        return this;
      },
    });
  };
  tbl_project_link.create = async (doc) => {
    const item = { _id: new mongoose.Types.ObjectId().toString(), updatedAt: new Date(), ...doc };
    linkDocs.push(item);
    return item;
  };
  tbl_project_link.findByIdAndUpdate = (id, update) => {
    const idx = linkDocs.findIndex((l) => String(l._id) === String(id));
    if (idx === -1) return wrapQuery(null);
    linkDocs[idx] = { ...linkDocs[idx], ...(update.$set || update) };
    return wrapQuery(linkDocs[idx]);
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

test("S1-05 GitHub & Project Links API security & integration tests", async (t) => {
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

  // 1. Unauthenticated -> 401
  const unauth = await requestJson(baseUrl, "GET", `/api/projects/me/${projectId1}/links`);
  assert.equal(unauth.status, 401);

  // 2. Meta includes link_types
  const meta = await requestJson(baseUrl, "GET", "/api/projects/meta", { token: student1Token });
  assert.equal(meta.status, 200);
  assert.ok(meta.data.link_types.some((lt) => lt.code === "GITHUB_REPOSITORY"));

  // 3. Reject GitHub impersonation host, unsafe scheme, invalid link type -> 400
  const impersonation = await requestJson(baseUrl, "POST", `/api/projects/me/${projectId1}/links`, {
    token: student1Token,
    body: {
      link_type: "GITHUB_REPOSITORY",
      url: "https://github.com.attacker.example/user/repo",
    },
  });
  assert.equal(impersonation.status, 400);

  const unsafeScheme = await requestJson(baseUrl, "POST", `/api/projects/me/${projectId1}/links`, {
    token: student1Token,
    body: { link_type: "LIVE_DEMO", url: "javascript:alert(1)" },
  });
  assert.equal(unsafeScheme.status, 400);

  const badType = await requestJson(baseUrl, "POST", `/api/projects/me/${projectId1}/links`, {
    token: student1Token,
    body: { link_type: "TIKTOK", url: "https://example.com/a" },
  });
  assert.equal(badType.status, 400);

  // 4. Add valid GitHub link & Live Demo -> 201
  const addGh = await requestJson(baseUrl, "POST", `/api/projects/me/${projectId1}/links`, {
    token: student1Token,
    body: {
      link_type: "GITHUB_REPOSITORY",
      url: "https://github.com/Prachi02-Makwana/thespotcampusfinal",
    },
  });
  assert.equal(addGh.status, 201);
  const ghLinkId = addGh.data.link.id;

  const addDemo = await requestJson(baseUrl, "POST", `/api/projects/me/${projectId1}/links`, {
    token: student1Token,
    body: {
      link_type: "LIVE_DEMO",
      url: "https://thespotcampus.netlify.app",
      label: "Production App",
    },
  });
  assert.equal(addDemo.status, 201);

  // 5. Duplicate link & second GitHub link -> 400
  const dupUrl = await requestJson(baseUrl, "POST", `/api/projects/me/${projectId1}/links`, {
    token: student1Token,
    body: {
      link_type: "PROJECT_WEBSITE",
      url: "https://thespotcampus.netlify.app",
    },
  });
  assert.equal(dupUrl.status, 400);

  const secondGh = await requestJson(baseUrl, "POST", `/api/projects/me/${projectId1}/links`, {
    token: student1Token,
    body: {
      link_type: "GITHUB_REPOSITORY",
      url: "https://github.com/Prachi02-Makwana/another",
    },
  });
  assert.equal(secondGh.status, 400);

  // 6. Private project links blocked for College -> 403; Public -> 200
  const privLinks = await requestJson(
    baseUrl,
    "GET",
    `/api/projects/student/${studentId1}/${projectId1}/links`,
    { token: college1Token },
  );
  assert.equal(privLinks.status, 403);

  projectDocs[0].visibility = "Public";
  const pubLinks = await requestJson(
    baseUrl,
    "GET",
    `/api/projects/student/${studentId1}/${projectId1}/links`,
    { token: college1Token },
  );
  assert.equal(pubLinks.status, 200);
  assert.equal(pubLinks.data.links.length, 2);

  // 7. IDOR & cross-college -> 403
  const idor = await requestJson(
    baseUrl,
    "PATCH",
    `/api/projects/student/${studentId1}/${projectId1}/links/${ghLinkId}`,
    { token: student2Token, body: { label: "Hacked" } },
  );
  assert.equal(idor.status, 403);

  const crossCollege = await requestJson(
    baseUrl,
    "GET",
    `/api/projects/student/${studentId1}/${projectId1}/links`,
    { token: college2Token },
  );
  assert.equal(crossCollege.status, 403);

  // 8. Reorder & Delete -> 200
  const reorder = await requestJson(baseUrl, "PATCH", `/api/projects/me/${projectId1}/links/reorder`, {
    token: student1Token,
    body: {
      orders: [
        { link_id: addDemo.data.link.id, display_order: 0 },
        { link_id: ghLinkId, display_order: 1 },
      ],
    },
  });
  assert.equal(reorder.status, 200);
  assert.equal(reorder.data.links[0].link_type, "LIVE_DEMO");

  const del = await requestJson(
    baseUrl,
    "DELETE",
    `/api/projects/me/${projectId1}/links/${ghLinkId}`,
    { token: student1Token },
  );
  assert.equal(del.status, 200);
  assert.ok(auditDocs.some((a) => a.action === "ADD_PROJECT_LINK"));
  assert.ok(auditDocs.some((a) => a.action === "DELETE_PROJECT_LINK"));
});
