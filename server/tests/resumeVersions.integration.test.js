import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-resume-versions";
process.env.JWT_EXPIRES_IN = "1d";

const { createJWT } = await import("../src/utils/tokenUtils.js");
const errorHandlerMiddleware = (await import("../src/middleware/errorHandlerMiddleware.js")).default;
const ResumeVersionsRouter = (
  await import("../src/modules/resumeVersions/resumeVersion.route.js")
).default;

const tbl_resume_version = (
  await import("../src/modules/resumeVersions/resumeVersion.model.js")
).default;
const tbl_student = (await import("../src/modules/student/student.model.js")).default;
const tbl_academic_history = (
  await import("../src/modules/academicProfile/academicHistory.model.js")
).default;
const tbl_student_skill = (await import("../src/modules/skills/studentSkill.model.js")).default;
const tbl_project = (await import("../src/modules/projects/project.model.js")).default;
const tbl_project_link = (await import("../src/modules/projects/projectLink.model.js")).default;
const tbl_certification = (
  await import("../src/modules/certifications/certification.model.js")
).default;
const tbl_internship = (await import("../src/modules/internships/internship.model.js")).default;
const tbl_cv_template = (await import("../src/modules/student/cvTemplate.model.js")).default;
const tbl_audit_log = (await import("../src/modules/audit/auditLog.model.js")).default;

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const companyId = new mongoose.Types.ObjectId().toString();
const proj1Id = new mongoose.Types.ObjectId().toString();
const proj2Id = new mongoose.Types.ObjectId().toString();
const tplId = new mongoose.Types.ObjectId().toString();

const wrapQuery = (value) => {
  const q = {
    populate() {
      return q;
    },
    select() {
      return q;
    },
    sort() {
      return q;
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
  return q;
};

let versionDocs = [];
let studentDocs = {};
let projectDocs = [];
let auditDocs = [];

const setupStubs = () => {
  versionDocs = [];
  projectDocs = [
    {
      _id: proj1Id,
      student_id: studentId1,
      title: "Campus <script>App</script>",
      description: "Live description",
      status: "Completed",
      visibility: "Public",
      is_deleted: false,
    },
    {
      _id: proj2Id,
      student_id: studentId2,
      title: "Student 2 Secret Project",
      description: "Secret",
      status: "Completed",
      visibility: "Private",
      is_deleted: false,
    },
  ];
  studentDocs = {
    [studentId1]: {
      _id: studentId1,
      student_name: "Prachi",
      student_email: "prachi@example.com",
      student_contact: "9998887776",
      college_id: collegeId1,
      university_id: uniId,
      is_deleted: false,
    },
    [studentId2]: {
      _id: studentId2,
      student_name: "Student2",
      college_id: collegeId2,
      university_id: uniId,
      is_deleted: false,
    },
  };
  auditDocs = [];

  tbl_student.findById = (id) => wrapQuery(studentDocs[String(id)] || null);
  tbl_academic_history.find = () => wrapQuery([]);
  tbl_student_skill.find = () => wrapQuery([]);
  tbl_project_link.find = () => wrapQuery([]);
  tbl_certification.find = () => wrapQuery([]);
  tbl_internship.find = () => wrapQuery([]);
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
  tbl_cv_template.find = () =>
    wrapQuery([
      {
        _id: tplId,
        name: "Default",
        html_content: "<div><h1>{{name}}</h1>{{#projects}}<p>{{title}}</p>{{/projects}}</div>",
        css_content: "",
      },
    ]);
  tbl_cv_template.findById = async () => ({
    _id: tplId,
    name: "Default",
    html_content: "<div><h1>{{name}}</h1>{{#projects}}<p>{{title}}</p>{{/projects}}</div>",
    css_content: "",
  });
  tbl_cv_template.findOne = async () => ({
    _id: tplId,
    name: "Default",
    html_content: "<div><h1>{{name}}</h1>{{#projects}}<p>{{title}}</p>{{/projects}}</div>",
    css_content: "",
  });

  tbl_resume_version.countDocuments = async (f) =>
    versionDocs.filter((v) => String(v.student_id) === String(f.student_id) && !v.is_deleted).length;
  tbl_resume_version.find = (f) =>
    wrapQuery(
      versionDocs.filter(
        (v) =>
          String(v.student_id) === String(f.student_id) &&
          !v.is_deleted &&
          (!f.visibility?.$ne || v.visibility !== f.visibility.$ne),
      ),
    );
  tbl_resume_version.findOne = (f) => {
    const found =
      versionDocs.find((v) => {
        if (v.is_deleted) return false;
        if (f._id && String(v._id) !== String(f._id)) return false;
        if (f.student_id && String(v.student_id) !== String(f.student_id)) return false;
        if (f.share_token && v.share_token !== f.share_token) return false;
        if (f.share_enabled !== undefined && v.share_enabled !== f.share_enabled) return false;
        return true;
      }) || null;
    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      async save() {
        const idx = versionDocs.findIndex((x) => String(x._id) === String(this._id));
        if (idx !== -1) versionDocs[idx] = { ...versionDocs[idx], ...this };
        return this;
      },
    });
  };
  tbl_resume_version.updateMany = async (f, update) => {
    for (const v of versionDocs) {
      if (
        String(v.student_id) === String(f.student_id) &&
        !v.is_deleted &&
        (!f._id?.$ne || String(v._id) !== String(f._id.$ne))
      ) {
        Object.assign(v, update.$set || {});
      }
    }
  };
  tbl_resume_version.create = async (doc) => {
    const item = {
      _id: new mongoose.Types.ObjectId().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...doc,
    };
    versionDocs.push(item);
    return item;
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

test("Multiple Resume Versions API & security regression tests", async (t) => {
  setupStubs();
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/resume-versions", ResumeVersionsRouter);
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

  // 1. Unauthenticated blocked
  assert.equal((await requestJson(baseUrl, "GET", "/api/resume-versions/me")).status, 401);

  // 2. Nested-resource attack: Student1 referencing Student2's project -> 400
  const nestedAttack = await requestJson(baseUrl, "POST", "/api/resume-versions/me", {
    token: student1Token,
    body: {
      name: "Attack Resume",
      selected_project_ids: [proj2Id],
    },
  });
  assert.equal(nestedAttack.status, 400);

  // 3. Create valid Private version -> 201
  const created = await requestJson(baseUrl, "POST", "/api/resume-versions/me", {
    token: student1Token,
    body: {
      name: "Placement Backend Resume",
      target_role: "Backend Engineer",
      summary: "Built APIs",
      template_id: tplId,
      selected_project_ids: [proj1Id],
      visibility: "Private",
    },
  });
  assert.equal(created.status, 201);
  const resumeId = created.data.resume_version.id;
  assert.equal(created.data.resume_version.is_default, true);

  // 4. Preview renders escaped HTML without XSS execution
  const preview = await requestJson(baseUrl, "POST", `/api/resume-versions/me/${resumeId}/preview`, {
    token: student1Token,
  });
  assert.equal(preview.status, 200);
  assert.ok(!preview.data.compiled_html.includes("<script>"));
  assert.ok(preview.data.compiled_html.includes("&lt;script&gt;"));

  // 5. Security Regression: Student2 IDOR on GET / PATCH / DELETE / PREVIEW / PDF -> 403
  assert.equal(
    (
      await requestJson(baseUrl, "GET", `/api/resume-versions/student/${studentId1}/${resumeId}`, {
        token: student2Token,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestJson(
        baseUrl,
        "POST",
        `/api/resume-versions/student/${studentId1}/${resumeId}/preview`,
        { token: student2Token },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await requestJson(
        baseUrl,
        "GET",
        `/api/resume-versions/student/${studentId1}/${resumeId}/download-pdf`,
        { token: student2Token },
      )
    ).status,
    403,
  );

  // 6. Private visibility hidden from College1; cross-college & Company denied -> 403
  const colPriv = await requestJson(baseUrl, "GET", `/api/resume-versions/student/${studentId1}`, {
    token: college1Token,
  });
  assert.equal(colPriv.status, 200);
  assert.equal(colPriv.data.resume_versions.length, 0);

  assert.equal(
    (
      await requestJson(baseUrl, "GET", `/api/resume-versions/student/${studentId1}`, {
        token: college2Token,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestJson(baseUrl, "GET", `/api/resume-versions/student/${studentId1}`, {
        token: companyToken,
      })
    ).status,
    403,
  );

  // 7. Share token flow: enable -> GET shared works -> revoke -> GET shared fails
  const shareOn = await requestJson(baseUrl, "PATCH", `/api/resume-versions/me/${resumeId}/share`, {
    token: student1Token,
    body: { share_enabled: true, expires_in_days: 10 },
  });
  assert.equal(shareOn.status, 200);
  const token = shareOn.data.resume_version.share_token;
  assert.equal(
    (await requestJson(baseUrl, "GET", `/api/resume-versions/shared/${token}`)).status,
    200,
  );

  await requestJson(baseUrl, "PATCH", `/api/resume-versions/me/${resumeId}/share`, {
    token: student1Token,
    body: { share_enabled: false },
  });
  assert.equal(
    (await requestJson(baseUrl, "GET", `/api/resume-versions/shared/${token}`)).status,
    404,
  );

  // 8. Delete -> 200
  const del = await requestJson(baseUrl, "DELETE", `/api/resume-versions/me/${resumeId}`, {
    token: student1Token,
  });
  assert.equal(del.status, 200);
  assert.ok(auditDocs.length >= 3);
});
