import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import mongoose from "mongoose";
import {
  hasPathTraversal,
  hasValidDocumentMagicBytes,
  sanitizeOriginalFilename,
} from "../src/middleware/documentUploadMiddleware.js";
import { createDocumentService } from "../src/modules/documents/document.service.js";
import { createAcademicProfileService } from "../src/modules/academicProfile/academicProfile.service.js";
import { MAX_DOCUMENTS_PER_USER } from "../src/utils/constants.js";

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const degreeId1 = new mongoose.Types.ObjectId().toString();
const resumeVer1Id = new mongoose.Types.ObjectId().toString();
const resumeVer2Id = new mongoose.Types.ObjectId().toString();

const wrapQuery = (result) => {
  const q = {
    sort() {
      return q;
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return q;
};

const makeHarness = ({ failNextCreate = false } = {}) => {
  const docsStore = [];
  const versionsStore = [
    { _id: resumeVer1Id, student_id: studentId1, name: "Backend Resume", uploaded_document_id: null, is_deleted: false },
    { _id: resumeVer2Id, student_id: studentId2, name: "Student2 Resume", uploaded_document_id: null, is_deleted: false },
  ];
  const deletedStorageKeys = [];
  const auditLogs = [];

  const students = {
    [studentId1]: { _id: studentId1, college_id: collegeId1, university_id: uniId, degree_id: degreeId1, is_deleted: false },
    [studentId2]: { _id: studentId2, college_id: collegeId1, university_id: uniId, degree_id: degreeId1, is_deleted: false },
  };

  const accessService = createAcademicProfileService({
    Student: { findById: (id) => wrapQuery(students[String(id)] || null) },
  });

  let shouldFailCreate = failNextCreate;

  const service = createDocumentService({
    accessService,
    Student: { findById: (id) => wrapQuery(students[String(id)] || null) },
    resolvePath: (key) => `/private/documents/${key}`,
    deleteFile: (key) => {
      deletedStorageKeys.push(key);
      return true;
    },
    ResumeVersion: {
      findOne: (f) => {
        const found =
          versionsStore.find(
            (v) =>
              String(v._id) === String(f._id) &&
              String(v.student_id) === String(f.student_id) &&
              !v.is_deleted,
          ) || null;
        if (!found) return wrapQuery(null);
        return wrapQuery({
          ...found,
          async save() {
            const idx = versionsStore.findIndex((x) => String(x._id) === String(this._id));
            if (idx !== -1) versionsStore[idx] = { ...versionsStore[idx], ...this };
            return this;
          },
        });
      },
      updateMany: async (f, update) => {
        for (const v of versionsStore) {
          if (
            String(v.student_id) === String(f.student_id) &&
            String(v.uploaded_document_id) === String(f.uploaded_document_id)
          ) {
            Object.assign(v, update.$set || {});
          }
        }
      },
    },
    Document: {
      find: (f) => {
        const list = docsStore.filter((d) => {
          if (String(d.owner_id) !== String(f.owner_id) || d.is_deleted) return false;
          if (f.document_type && d.document_type !== f.document_type) return false;
          if (f.status && d.status !== f.status) return false;
          if (f.visibility?.$ne && d.visibility === f.visibility.$ne) return false;
          return true;
        });
        return wrapQuery(list);
      },
      findOne: (f) => {
        const found =
          docsStore.find((d) => {
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
            const idx = docsStore.findIndex((x) => String(x._id) === String(this._id));
            if (idx !== -1) docsStore[idx] = { ...docsStore[idx], ...this };
            return this;
          },
        });
      },
      create: async (doc) => {
        if (shouldFailCreate) {
          shouldFailCreate = false;
          throw new Error("Simulated DB persistence error");
        }
        const item = {
          _id: new mongoose.Types.ObjectId().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...doc,
        };
        docsStore.push(item);
        return item;
      },
    },
    AuditLog: {
      create: async (doc) => {
        auditLogs.push(doc);
        return doc;
      },
    },
  });

  return { service, docsStore, versionsStore, deletedStorageKeys, auditLogs };
};

test("Filename path traversal, sanitization, and magic byte validators work accurately", () => {
  assert.equal(hasPathTraversal("../etc/passwd"), true);
  assert.equal(hasPathTraversal("..\\Windows\\system32"), true);
  assert.equal(hasPathTraversal("C:\\secret.pdf"), true);
  assert.equal(hasPathTraversal("resume_2025.pdf"), false);
  assert.equal(sanitizeOriginalFilename("my <weird> resume (1).pdf"), "my_weird_resume_1_.pdf");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "s109-magic-"));
  const pdfPath = path.join(tmpDir, "valid.pdf");
  const docxPath = path.join(tmpDir, "valid.docx");
  const fakePdfPath = path.join(tmpDir, "spoof.pdf");
  fs.writeFileSync(pdfPath, Buffer.from("%PDF-1.5\nhello"));
  fs.writeFileSync(docxPath, Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]));
  fs.writeFileSync(fakePdfPath, Buffer.from("MZ\x90\x00notapdf"));

  assert.equal(hasValidDocumentMagicBytes(pdfPath, ".pdf"), true);
  assert.equal(hasValidDocumentMagicBytes(docxPath, ".docx"), true);
  assert.equal(hasValidDocumentMagicBytes(fakePdfPath, ".pdf"), false);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Document upload cleans orphan storage on DB error, rejects duplicates & quota overflow, and integrates S1-08 cleanly", async () => {
  const failHarness = makeHarness({ failNextCreate: true });
  await assert.rejects(
    () =>
      failHarness.service.uploadDocument(
        { userId: studentId1, role: "Student" },
        studentId1,
        {
          filename: "orphan-check.pdf",
          originalname: "resume.pdf",
          mimetype: "application/pdf",
          size: 1024,
          checksum: "abc123",
        },
        { document_type: "RESUME" },
      ),
    /Simulated DB/i,
  );
  assert.ok(failHarness.deletedStorageKeys.includes("orphan-check.pdf"));

  const { service, versionsStore, deletedStorageKeys, auditLogs } = makeHarness();

  const uploaded = await service.uploadDocument(
    { userId: studentId1, role: "Student" },
    studentId1,
    {
      filename: "doc-1.pdf",
      originalname: "My Resume.pdf",
      mimetype: "application/pdf",
      size: 2048,
      checksum: "sha256-hash-1",
    },
    { document_type: "RESUME", title: "Software Engineer Resume" },
  );
  assert.equal(uploaded.document.version, 1);
  assert.equal(uploaded.document.storage_key, undefined);
  assert.equal(uploaded.document.malware_scan_status, "NotScanned");

  // Identical checksum rejected
  await assert.rejects(
    () =>
      service.uploadDocument(
        { userId: studentId1, role: "Student" },
        studentId1,
        {
          filename: "doc-dup.pdf",
          originalname: "Copy.pdf",
          mimetype: "application/pdf",
          size: 2048,
          checksum: "sha256-hash-1",
        },
        { document_type: "RESUME" },
      ),
    /identical file/i,
  );
  assert.ok(deletedStorageKeys.includes("doc-dup.pdf"));

  // Replace increments version and removes superseded storage key
  const replaced = await service.replaceDocumentFile(
    { userId: studentId1, role: "Student" },
    studentId1,
    uploaded.document.id,
    {
      filename: "doc-2.docx",
      originalname: "Updated Resume.docx",
      mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 4096,
      checksum: "sha256-hash-2",
    },
    {},
  );
  assert.equal(replaced.document.version, 2);
  assert.ok(deletedStorageKeys.includes("doc-1.pdf"));

  // Preview inline allowed for PDF/images, forced attachment for DOCX
  const dlDocx = await service.getDocumentForDownload(
    { userId: studentId1, role: "Student" },
    studentId1,
    uploaded.document.id,
    { inline: true },
  );
  assert.equal(dlDocx.disposition, "attachment");

  // S1-08 association rejects Student2's resume version
  await assert.rejects(
    () =>
      service.associateWithResumeVersion(
        { userId: studentId1, role: "Student" },
        studentId1,
        uploaded.document.id,
        resumeVer2Id,
      ),
    /not found for this student/i,
  );

  // S1-08 valid association succeeds and soft delete clears link
  await service.associateWithResumeVersion(
    { userId: studentId1, role: "Student" },
    studentId1,
    uploaded.document.id,
    resumeVer1Id,
  );
  assert.equal(String(versionsStore[0].uploaded_document_id), String(uploaded.document.id));

  await service.deleteDocument(
    { userId: studentId1, role: "Student" },
    studentId1,
    uploaded.document.id,
  );
  assert.equal(versionsStore[0].uploaded_document_id, null);

  // Quota test
  for (let i = 0; i < MAX_DOCUMENTS_PER_USER; i++) {
    await service.uploadDocument(
      { userId: studentId1, role: "Student" },
      studentId1,
      {
        filename: `q-${i}.pdf`,
        originalname: `q-${i}.pdf`,
        mimetype: "application/pdf",
        size: 100,
        checksum: `hash-quota-${i}`,
      },
      { document_type: "RESUME" },
    );
  }
  await assert.rejects(
    () =>
      service.uploadDocument(
        { userId: studentId1, role: "Student" },
        studentId1,
        {
          filename: "q-over.pdf",
          originalname: "over.pdf",
          mimetype: "application/pdf",
          size: 100,
          checksum: "hash-over",
        },
        { document_type: "RESUME" },
      ),
    /Document quota reached/i,
  );
  assert.ok(deletedStorageKeys.includes("q-over.pdf"));
  assert.ok(auditLogs.some((a) => a.action === "ASSOCIATE_RESUME_DOCUMENT"));
});
