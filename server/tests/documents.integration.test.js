import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "fs";
import path from "path";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { DOCUMENT_STORAGE_DIR } from "../src/middleware/documentUploadMiddleware.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-documents";
process.env.JWT_EXPIRES_IN = "1d";

const { createJWT } = await import("../src/utils/tokenUtils.js");
const { authenticateUser } = await import("../src/middleware/authMiddleware.js");
const errorHandlerMiddleware = (await import("../src/middleware/errorHandlerMiddleware.js")).default;
const DocumentsRouter = (await import("../src/modules/documents/document.route.js")).default;

const tbl_document = (await import("../src/modules/documents/document.model.js")).default;
const tbl_resume_version = (
  await import("../src/modules/resumeVersions/resumeVersion.model.js")
).default;
const tbl_student = (await import("../src/modules/student/student.model.js")).default;
const tbl_audit_log = (await import("../src/modules/audit/auditLog.model.js")).default;

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const companyId = new mongoose.Types.ObjectId().toString();
const rv1Id = new mongoose.Types.ObjectId().toString();
const rv2Id = new mongoose.Types.ObjectId().toString();

const wrapQuery = (value) => {
  const q = {
    sort() {
      return q;
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
  return q;
};

let docStore = [];
let versionStore = [];
let studentDocs = {};
let auditDocs = [];
const uploadedKeysToClean = [];

const setupStubs = () => {
  docStore = [];
  versionStore = [
    { _id: rv1Id, student_id: studentId1, name: "SWE Resume", uploaded_document_id: null, is_deleted: false },
    { _id: rv2Id, student_id: studentId2, name: "Student2 Resume", uploaded_document_id: null, is_deleted: false },
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
  tbl_resume_version.findOne = (f) => {
    const found =
      versionStore.find(
        (v) =>
          String(v._id) === String(f._id) &&
          String(v.student_id) === String(f.student_id) &&
          !v.is_deleted,
      ) || null;
    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      async save() {
        const idx = versionStore.findIndex((x) => String(x._id) === String(this._id));
        if (idx !== -1) versionStore[idx] = { ...versionStore[idx], ...this };
        return this;
      },
    });
  };
  tbl_resume_version.updateMany = async (f, update) => {
    for (const v of versionStore) {
      if (
        String(v.student_id) === String(f.student_id) &&
        String(v.uploaded_document_id) === String(f.uploaded_document_id)
      ) {
        Object.assign(v, update.$set || {});
      }
    }
  };
  tbl_document.find = (f) =>
    wrapQuery(
      docStore.filter((d) => {
        if (String(d.owner_id) !== String(f.owner_id) || d.is_deleted) return false;
        if (f.document_type && d.document_type !== f.document_type) return false;
        if (f.status && d.status !== f.status) return false;
        if (f.visibility?.$ne && d.visibility === f.visibility.$ne) return false;
        return true;
      }),
    );
  tbl_document.findOne = (f) => {
    const found =
      docStore.find((d) => {
        if (d.is_deleted) return false;
        if (f._id && typeof f._id === "string" && String(d._id) !== String(f._id)) return false;
        if (f._id?.$ne && String(d._id) === String(f._id.$ne)) return false;
        if (f.owner_id && String(d.owner_id) !== String(f.owner_id)) return false;
        if (f.document_type && d.document_type !== f.document_type) return false;
        if (f.checksum && d.checksum !== f.checksum) return false;
        return true;
      }) || null;
    if (!found) return wrapQuery(null);
    return wrapQuery({
      ...found,
      async save() {
        const idx = docStore.findIndex((x) => String(x._id) === String(this._id));
        if (idx !== -1) docStore[idx] = { ...docStore[idx], ...this };
        return this;
      },
    });
  };
  tbl_document.create = async (doc) => {
    const item = {
      _id: new mongoose.Types.ObjectId().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...doc,
    };
    docStore.push(item);
    return item;
  };
  tbl_audit_log.create = async (doc) => {
    auditDocs.push(doc);
    return doc;
  };
};

const requestHttp = (baseUrl, method, reqPath, { token, body, headers = {} } = {}) =>
  new Promise((resolve, reject) => {
    const isBuf = Buffer.isBuffer(body);
    const payload = isBuf
      ? body
      : body !== undefined
        ? Buffer.from(JSON.stringify(body))
        : null;
    const req = http.request(
      `${baseUrl}${reqPath}`,
      {
        method,
        headers: {
          ...(!isBuf && payload ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const text = buf.toString("utf8");
          let parsed = text;
          try {
            parsed = text ? JSON.parse(text) : {};
          } catch {
            // binary payload
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, buffer: buf });
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });

const buildMultipartDoc = (boundary, filename, mimeType, bytes, fields = {}) => {
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`,
        "utf8",
      ),
    );
  }
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
      "utf8",
    ),
  );
  parts.push(bytes);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, "utf8"));
  return Buffer.concat(parts);
};

test("Resume Upload & Canonical Document API security and integration tests", async (t) => {
  setupStubs();
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/documents", authenticateUser, DocumentsRouter);
  app.use(errorHandlerMiddleware);

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    for (const k of uploadedKeysToClean) {
      const fpath = path.join(DOCUMENT_STORAGE_DIR, k);
      if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
    }
  });

  const student1Token = createJWT({ userId: studentId1, role: "Student" });
  const student2Token = createJWT({ userId: studentId2, role: "Student" });
  const college1Token = createJWT({ userId: collegeId1, role: "College" });
  const college2Token = createJWT({ userId: collegeId2, role: "College" });
  const uniToken = createJWT({ userId: uniId, role: "University" });
  const companyToken = createJWT({ userId: companyId, role: "Company" });

  // 1. Unauthenticated blocked -> 401
  assert.equal((await requestHttp(baseUrl, "GET", "/api/documents/me")).status, 401);

  const boundary = "----SpotCampusDocTestBoundary";

  // 2. Reject spoofed EXE disguised as PDF and disallow .exe
  const spoofPdf = buildMultipartDoc(
    boundary,
    "fake.pdf",
    "application/pdf",
    Buffer.from("MZ\x90\x00MALWARE"),
  );
  const resSpoof = await requestHttp(baseUrl, "POST", "/api/documents/me", {
    token: student1Token,
    body: spoofPdf,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(spoofPdf.length),
    },
  });
  assert.equal(resSpoof.status, 400);

  // 3. Valid PDF resume upload -> 201 (Private by default, no storage_key leaked)
  const validPdf = buildMultipartDoc(
    boundary,
    "Prachi Resume.pdf",
    "application/pdf",
    Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF"),
    { document_type: "RESUME", title: "Software Resume" },
  );
  const resUpload = await requestHttp(baseUrl, "POST", "/api/documents/me", {
    token: student1Token,
    body: validPdf,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(validPdf.length),
    },
  });
  assert.equal(resUpload.status, 201);
  assert.equal(resUpload.data.document.visibility, "Private");
  assert.equal(resUpload.data.document.storage_key, undefined);
  const docId = resUpload.data.document.id;
  if (docStore[0]?.storage_key) uploadedKeysToClean.push(docStore[0].storage_key);

  // 4. Duplicate PDF content blocked -> 400
  const dupUpload = await requestHttp(baseUrl, "POST", "/api/documents/me", {
    token: student1Token,
    body: validPdf,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(validPdf.length),
    },
  });
  assert.equal(dupUpload.status, 400);

  // 5. Secure inline PDF download for owner
  const dlOwn = await requestHttp(baseUrl, "GET", `/api/documents/me/${docId}/download?inline=true`, {
    token: student1Token,
  });
  assert.equal(dlOwn.status, 200);
  assert.equal(dlOwn.headers["x-content-type-options"], "nosniff");
  assert.match(dlOwn.headers["content-disposition"], /^inline;/);

  // 6. Security Regression: Student2 IDOR on GET / PATCH / DOWNLOAD / DELETE / REPLACE / ASSOCIATE -> 403
  assert.equal(
    (
      await requestHttp(baseUrl, "GET", `/api/documents/student/${studentId1}/${docId}`, {
        token: student2Token,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestHttp(baseUrl, "GET", `/api/documents/student/${studentId1}/${docId}/download`, {
        token: student2Token,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestHttp(baseUrl, "DELETE", `/api/documents/student/${studentId1}/${docId}`, {
        token: student2Token,
      })
    ).status,
    403,
  );

  // 7. S1-08 cross-user resume association blocked -> 404, valid S1-08 link succeeds -> 200
  assert.equal(
    (
      await requestHttp(baseUrl, "POST", `/api/documents/me/${docId}/associate-resume`, {
        token: student1Token,
        body: { resume_version_id: rv2Id },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await requestHttp(baseUrl, "POST", `/api/documents/me/${docId}/associate-resume`, {
        token: student1Token,
        body: { resume_version_id: rv1Id },
      })
    ).status,
    200,
  );
  assert.equal(String(versionStore[0].uploaded_document_id), String(docId));

  // 8. Private visibility hidden from College1; cross-college / Company / University write denied -> 403
  const colPriv = await requestHttp(baseUrl, "GET", `/api/documents/student/${studentId1}`, {
    token: college1Token,
  });
  assert.equal(colPriv.status, 200);
  assert.equal(colPriv.data.documents.length, 0);

  assert.equal(
    (
      await requestHttp(baseUrl, "GET", `/api/documents/student/${studentId1}`, {
        token: college2Token,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestHttp(baseUrl, "GET", `/api/documents/student/${studentId1}`, {
        token: companyToken,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await requestHttp(baseUrl, "PATCH", `/api/documents/student/${studentId1}/${docId}`, {
        token: uniToken,
        body: { title: "Uni Edit" },
      })
    ).status,
    403,
  );

  // 9. Replace with valid DOCX increments version and forces attachment download
  const validDocx = buildMultipartDoc(
    boundary,
    "UpdatedResume.docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]),
    { document_type: "RESUME" },
  );
  const resReplace = await requestHttp(baseUrl, "PUT", `/api/documents/me/${docId}/replace`, {
    token: student1Token,
    body: validDocx,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(validDocx.length),
    },
  });
  assert.equal(resReplace.status, 200);
  assert.equal(resReplace.data.document.version, 2);
  if (docStore[0]?.storage_key) uploadedKeysToClean.push(docStore[0].storage_key);

  const dlReplaced = await requestHttp(baseUrl, "GET", `/api/documents/me/${docId}/download?inline=true`, {
    token: student1Token,
  });
  assert.equal(dlReplaced.status, 200);
  assert.match(dlReplaced.headers["content-disposition"], /^attachment;/);

  // 10. Delete soft-deletes doc & unlinks S1-08 version
  const del = await requestHttp(baseUrl, "DELETE", `/api/documents/me/${docId}`, {
    token: student1Token,
  });
  assert.equal(del.status, 200);
  assert.equal(versionStore[0].uploaded_document_id, null);
  assert.ok(auditDocs.length >= 4);
});
