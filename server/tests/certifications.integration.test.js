import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "fs";
import path from "path";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { CERTIFICATE_STORAGE_DIR } from "../src/middleware/certificationUploadMiddleware.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-certifications";
process.env.JWT_EXPIRES_IN = "1d";

const { createJWT } = await import("../src/utils/tokenUtils.js");
const { authenticateUser } = await import("../src/middleware/authMiddleware.js");
const errorHandlerMiddleware = (await import("../src/middleware/errorHandlerMiddleware.js")).default;
const CertificationsRouter = (
  await import("../src/modules/certifications/certification.route.js")
).default;

const tbl_certification = (
  await import("../src/modules/certifications/certification.model.js")
).default;
const tbl_student = (await import("../src/modules/student/student.model.js")).default;
const tbl_audit_log = (await import("../src/modules/audit/auditLog.model.js")).default;

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const companyId = new mongoose.Types.ObjectId().toString();

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

let certDocs = [];
let studentDocs = {};
let auditDocs = [];
const uploadedTestFiles = [];

const setupStubs = () => {
  certDocs = [];
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
  tbl_certification.countDocuments = async (f) =>
    certDocs.filter(
      (c) =>
        String(c.student_id) === String(f.student_id) &&
        !c.is_deleted &&
        (!f.visibility?.$ne || c.visibility !== f.visibility.$ne),
    ).length;

  tbl_certification.find = (f) => {
    const list = certDocs
      .filter((c) => {
        if (String(c.student_id) !== String(f.student_id) || c.is_deleted) return false;
        if (f.status && c.status !== f.status) return false;
        if (f.category && c.category !== f.category) return false;
        if (f.visibility?.$ne && c.visibility === f.visibility.$ne) return false;
        if (f.$or) {
          return f.$or.some((cond) => {
            const [k, rx] = Object.entries(cond)[0];
            return rx.test(String(c[k] || ""));
          });
        }
        return true;
      })
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return wrapQuery(list);
  };

  tbl_certification.findOne = (f) => {
    const found =
      certDocs.find((c) => {
        if (c.is_deleted) return false;
        if (f._id && typeof f._id === "string" && String(c._id) !== String(f._id)) return false;
        if (f._id?.$ne && String(c._id) === String(f._id.$ne)) return false;
        if (f.student_id && String(c.student_id) !== String(f.student_id)) return false;
        if (f.normalized_issuer && c.normalized_issuer !== f.normalized_issuer) return false;
        if (
          f.normalized_credential_id !== undefined &&
          c.normalized_credential_id !== f.normalized_credential_id
        ) {
          return false;
        }
        if (f.normalized_title && c.normalized_title !== f.normalized_title) return false;
        if (
          f.issue_date &&
          new Date(c.issue_date).getTime() !== new Date(f.issue_date).getTime()
        ) {
          return false;
        }
        return true;
      }) || null;

    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      async save() {
        const idx = certDocs.findIndex((x) => String(x._id) === String(this._id));
        if (idx !== -1) certDocs[idx] = { ...certDocs[idx], ...this };
        return this;
      },
    });
  };

  tbl_certification.create = async (doc) => {
    const item = {
      _id: new mongoose.Types.ObjectId().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...doc,
    };
    certDocs.push(item);
    return item;
  };

  tbl_certification.findByIdAndUpdate = (id, update) => {
    const idx = certDocs.findIndex((c) => String(c._id) === String(id));
    if (idx === -1) return wrapQuery(null);
    certDocs[idx] = { ...certDocs[idx], ...(update.$set || update) };
    return wrapQuery(certDocs[idx]);
  };

  tbl_audit_log.create = async (doc) => {
    auditDocs.push(doc);
    return doc;
  };
};

const requestHttp = (baseUrl, method, reqPath, { token, body, headers = {} } = {}) =>
  new Promise((resolve, reject) => {
    const isBuffer = Buffer.isBuffer(body);
    const payload = isBuffer
      ? body
      : body !== undefined
        ? Buffer.from(JSON.stringify(body))
        : null;
    const req = http.request(
      `${baseUrl}${reqPath}`,
      {
        method,
        headers: {
          ...(!isBuffer && payload ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const raw = buf.toString("utf8");
          let parsed = raw;
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch {
            // raw binary/text response
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, buffer: buf });
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });

const buildMultipartBody = (boundary, fieldName, filename, mimeType, fileBytes) => {
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
    "utf8",
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`, "utf8");
  return Buffer.concat([head, fileBytes, tail]);
};

test("Certifications Management API & security regression tests", async (t) => {
  setupStubs();
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/certifications", authenticateUser, CertificationsRouter);
  app.use(errorHandlerMiddleware);

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    for (const fname of uploadedTestFiles) {
      const fpath = path.join(CERTIFICATE_STORAGE_DIR, fname);
      if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
    }
  });

  const student1Token = createJWT({ userId: studentId1, role: "Student" });
  const student2Token = createJWT({ userId: studentId2, role: "Student" });
  const college1Token = createJWT({ userId: collegeId1, role: "College" });
  const college2Token = createJWT({ userId: collegeId2, role: "College" });
  const uniToken = createJWT({ userId: uniId, role: "University" });
  const companyToken = createJWT({ userId: companyId, role: "Company" });

  // 1. Unauthenticated access blocked
  const unauth = await requestHttp(baseUrl, "GET", "/api/certifications/me");
  assert.equal(unauth.status, 401);

  // 2. Metadata endpoint
  const meta = await requestHttp(baseUrl, "GET", "/api/certifications/meta", {
    token: student1Token,
  });
  assert.equal(meta.status, 200);
  assert.ok(meta.data.categories.includes("Cloud & DevOps"));

  // 3. Reject unsafe credential URL & HTTP-only credential URL & inverted dates
  const badUrl = await requestHttp(baseUrl, "POST", "/api/certifications/me", {
    token: student1Token,
    body: {
      title: "Unsafe Cert",
      issuing_organization: "Org",
      issue_date: "2025-01-01",
      credential_url: "javascript:alert(1)",
    },
  });
  assert.equal(badUrl.status, 400);

  const httpUrl = await requestHttp(baseUrl, "POST", "/api/certifications/me", {
    token: student1Token,
    body: {
      title: "HTTP Cert",
      issuing_organization: "Org",
      issue_date: "2025-01-01",
      credential_url: "http://example.com/cert/1",
    },
  });
  assert.equal(httpUrl.status, 400);

  const badDates = await requestHttp(baseUrl, "POST", "/api/certifications/me", {
    token: student1Token,
    body: {
      title: "Date Mismatch",
      issuing_organization: "Org",
      issue_date: "2025-05-01",
      expiry_date: "2025-01-01",
    },
  });
  assert.equal(badDates.status, 400);

  // 4. Create valid Private certification -> 201
  const created = await requestHttp(baseUrl, "POST", "/api/certifications/me", {
    token: student1Token,
    body: {
      title: "Google Cloud Associate",
      issuing_organization: "Google Cloud",
      category: "Cloud & DevOps",
      credential_id: "GCP-ACE-991",
      credential_url: "https://www.credential.net/gcp-ace-991",
      issue_date: "2025-02-01",
      expiry_date: "2028-02-01",
      visibility: "Private",
    },
  });
  assert.equal(created.status, 201);
  const certId = created.data.certification.id;

  // 5. Upload valid PDF certificate and download securely
  const boundary = "----SpotCampusBoundaryTest";
  const pdfPayload = buildMultipartBody(
    boundary,
    "certificate",
    "gcp-cert.pdf",
    "application/pdf",
    Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF"),
  );
  const uploadOk = await requestHttp(
    baseUrl,
    "POST",
    `/api/certifications/me/${certId}/certificate`,
    {
      token: student1Token,
      body: pdfPayload,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(pdfPayload.length),
      },
    },
  );
  assert.equal(uploadOk.status, 200);
  assert.equal(uploadOk.data.certification.has_attachment, true);
  if (certDocs[0]?.certificate_file?.filename) {
    uploadedTestFiles.push(certDocs[0].certificate_file.filename);
  }

  // Reject spoofed PDF (MZ executable magic bytes inside .pdf file)
  const fakePdfPayload = buildMultipartBody(
    boundary,
    "certificate",
    "malware.pdf",
    "application/pdf",
    Buffer.from("MZ\x90\x00FAKEEXE"),
  );
  const uploadFake = await requestHttp(
    baseUrl,
    "POST",
    `/api/certifications/me/${certId}/certificate`,
    {
      token: student1Token,
      body: fakePdfPayload,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(fakePdfPayload.length),
      },
    },
  );
  assert.equal(uploadFake.status, 400);

  // Student1 can download own certificate with nosniff header
  const downloadOwn = await requestHttp(
    baseUrl,
    "GET",
    `/api/certifications/me/${certId}/certificate`,
    { token: student1Token },
  );
  assert.equal(downloadOwn.status, 200);
  assert.equal(downloadOwn.headers["x-content-type-options"], "nosniff");
  assert.ok(downloadOwn.buffer.toString("ascii").startsWith("%PDF-"));

  // 6. Security Regression: Student2 IDOR across GET, PATCH, DELETE, certificate download/upload/delete -> 403
  assert.equal(
    (
      await requestHttp(baseUrl, "GET", `/api/certifications/student/${studentId1}/${certId}`, {
        token: student2Token,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestHttp(baseUrl, "PATCH", `/api/certifications/student/${studentId1}/${certId}`, {
        token: student2Token,
        body: { title: "Hijacked" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestHttp(baseUrl, "DELETE", `/api/certifications/student/${studentId1}/${certId}`, {
        token: student2Token,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestHttp(
        baseUrl,
        "GET",
        `/api/certifications/student/${studentId1}/${certId}/certificate`,
        { token: student2Token },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await requestHttp(
        baseUrl,
        "DELETE",
        `/api/certifications/student/${studentId1}/${certId}/certificate`,
        { token: student2Token },
      )
    ).status,
    403,
  );

  // 7. Private visibility blocks Institute/College1 & University certificate/record access until Public
  const collegePrivateList = await requestHttp(
    baseUrl,
    "GET",
    `/api/certifications/student/${studentId1}`,
    { token: college1Token },
  );
  assert.equal(collegePrivateList.status, 200);
  assert.equal(collegePrivateList.data.certifications.length, 0);

  const collegePrivateDirect = await requestHttp(
    baseUrl,
    "GET",
    `/api/certifications/student/${studentId1}/${certId}/certificate`,
    { token: college1Token },
  );
  assert.equal(collegePrivateDirect.status, 403);

  // Switch visibility to Public
  const makePublic = await requestHttp(baseUrl, "PATCH", `/api/certifications/me/${certId}`, {
    token: student1Token,
    body: { visibility: "Public" },
  });
  assert.equal(makePublic.status, 200);

  const collegePublicList = await requestHttp(
    baseUrl,
    "GET",
    `/api/certifications/student/${studentId1}`,
    { token: college1Token },
  );
  assert.equal(collegePublicList.status, 200);
  assert.equal(collegePublicList.data.certifications.length, 1);

  // Cross-college, Company, and University write all denied -> 403
  assert.equal(
    (
      await requestHttp(baseUrl, "GET", `/api/certifications/student/${studentId1}`, {
        token: college2Token,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestHttp(baseUrl, "GET", `/api/certifications/student/${studentId1}`, {
        token: companyToken,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestHttp(baseUrl, "PATCH", `/api/certifications/student/${studentId1}/${certId}`, {
        token: uniToken,
        body: { title: "Uni Edit" },
      })
    ).status,
    403,
  );

  // 8. Delete certification -> 200
  const del = await requestHttp(baseUrl, "DELETE", `/api/certifications/me/${certId}`, {
    token: student1Token,
  });
  assert.equal(del.status, 200);
  assert.ok(auditDocs.length >= 3);
});
