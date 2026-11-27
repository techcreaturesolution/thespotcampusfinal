import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  createCertificationService,
  validateAndNormalizeCredentialUrl,
  validateCertificationDates,
} from "../src/modules/certifications/certification.service.js";
import { createAcademicProfileService } from "../src/modules/academicProfile/academicProfile.service.js";

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const degreeId1 = new mongoose.Types.ObjectId().toString();

const wrapQuery = (result) => {
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
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return q;
};

const makeHarness = () => {
  const certsStore = [];
  const auditLogs = [];
  const removedFiles = [];

  const students = {
    [studentId1]: {
      _id: studentId1,
      college_id: collegeId1,
      university_id: uniId,
      degree_id: degreeId1,
      is_deleted: false,
    },
    [studentId2]: {
      _id: studentId2,
      college_id: collegeId2,
      university_id: uniId,
      degree_id: degreeId1,
      is_deleted: false,
    },
  };

  const accessService = createAcademicProfileService({
    Student: { findById: (id) => wrapQuery(students[String(id)] || null) },
  });

  const service = createCertificationService({
    accessService,
    Student: { findById: (id) => wrapQuery(students[String(id)] || null) },
    resolveFilePath: (filename) => `/private/${filename}`,
    removeFile: (filename) => {
      removedFiles.push(filename);
      return true;
    },
    Certification: {
      countDocuments: async (f) =>
        certsStore.filter(
          (c) =>
            String(c.student_id) === String(f.student_id) &&
            !c.is_deleted &&
            (!f.visibility?.$ne || c.visibility !== f.visibility.$ne),
        ).length,
      find: (f) => {
        const list = certsStore
          .filter((c) => {
            if (String(c.student_id) !== String(f.student_id) || c.is_deleted) return false;
            if (f.status && c.status !== f.status) return false;
            if (f.category && c.category !== f.category) return false;
            if (f.visibility?.$ne && c.visibility === f.visibility.$ne) return false;
            if (f.$or) {
              const matched = f.$or.some((cond) => {
                const [k, rx] = Object.entries(cond)[0];
                return rx.test(String(c[k] || ""));
              });
              if (!matched) return false;
            }
            return true;
          })
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        return wrapQuery(list);
      },
      findOne: (f) => {
        const found =
          certsStore.find((c) => {
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
            const idx = certsStore.findIndex((x) => String(x._id) === String(this._id));
            if (idx !== -1) certsStore[idx] = { ...certsStore[idx], ...this };
            return this;
          },
        });
      },
      create: async (doc) => {
        const item = {
          _id: new mongoose.Types.ObjectId().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...doc,
        };
        certsStore.push(item);
        return item;
      },
      findByIdAndUpdate: (id, update) => {
        const idx = certsStore.findIndex((c) => String(c._id) === String(id));
        if (idx === -1) return wrapQuery(null);
        certsStore[idx] = { ...certsStore[idx], ...(update.$set || update) };
        return wrapQuery(certsStore[idx]);
      },
    },
    AuditLog: {
      create: async (doc) => {
        auditLogs.push(doc);
        return doc;
      },
    },
  });

  return { service, certsStore, auditLogs, removedFiles };
};

test("validateAndNormalizeCredentialUrl enforces HTTPS and blocks dangerous protocols", () => {
  assert.equal(
    validateAndNormalizeCredentialUrl("https://www.credly.com/badges/abc-123"),
    "https://www.credly.com/badges/abc-123",
  );
  assert.equal(validateAndNormalizeCredentialUrl(""), "");
  assert.throws(
    () => validateAndNormalizeCredentialUrl("http://credly.com/badges/abc"),
    /https:\/\//i,
  );
  assert.throws(
    () => validateAndNormalizeCredentialUrl("javascript:alert(1)"),
    /unsafe protocol/i,
  );
  assert.throws(
    () => validateAndNormalizeCredentialUrl("data:text/html,<script>"),
    /unsafe protocol/i,
  );
  assert.throws(
    () => validateAndNormalizeCredentialUrl("vbscript:msgbox(1)"),
    /unsafe protocol/i,
  );
  assert.throws(
    () => validateAndNormalizeCredentialUrl("file:///etc/passwd"),
    /unsafe protocol/i,
  );
});

test("validateCertificationDates enforces ordering and does_not_expire clears expiry_date", () => {
  const valid = validateCertificationDates("2025-01-10", "2027-01-10", false);
  assert.ok(valid.issue_date instanceof Date);
  assert.ok(valid.expiry_date instanceof Date);

  const neverExp = validateCertificationDates("2025-01-10", "2024-01-10", true);
  assert.equal(neverExp.expiry_date, null);

  assert.throws(
    () => validateCertificationDates("2025-05-10", "2024-05-10", false),
    /cannot be earlier/i,
  );
});

test("Certification CRUD handles duplicates, mass assignment, attachments, ordering, and soft delete", async () => {
  const { service, certsStore, auditLogs, removedFiles } = makeHarness();

  await assert.rejects(
    () =>
      service.createCertification({ userId: studentId1, role: "Student" }, studentId1, {
        student_id: studentId2,
        title: "Mass Assigned Cert",
        issuing_organization: "AWS",
        issue_date: "2025-01-01",
      }),
    /cannot be supplied by client/i,
  );

  await assert.rejects(
    () =>
      service.createCertification({ userId: studentId1, role: "Student" }, studentId1, {
        institute_id: collegeId2,
        title: "Spoofed Institute",
        issuing_organization: "AWS",
        issue_date: "2025-01-01",
      }),
    /cannot be supplied by client/i,
  );

  const created = await service.createCertification(
    { userId: studentId1, role: "Student" },
    studentId1,
    {
      title: "<b>AWS Certified Developer</b>",
      issuing_organization: "Amazon   Web Services",
      category: "Cloud & DevOps",
      credential_id: "AWS-DEV-001",
      credential_url: "https://aws.amazon.com/verification/AWS-DEV-001",
      issue_date: "2025-02-01",
      expiry_date: "2028-02-01",
      does_not_expire: false,
      visibility: "Private",
    },
  );
  assert.equal(created.certification.title, "AWS Certified Developer");
  assert.equal(created.certification.issuing_organization, "Amazon Web Services");

  // Same issuer + credential_id rejected case-insensitively
  await assert.rejects(
    () =>
      service.createCertification({ userId: studentId1, role: "Student" }, studentId1, {
        title: "Duplicate Cred",
        issuing_organization: "amazon web services",
        credential_id: "aws-dev-001",
        issue_date: "2025-03-01",
      }),
    /already exists/i,
  );

  // Same title/issuer allowed when credential_id is different
  const second = await service.createCertification(
    { userId: studentId1, role: "Student" },
    studentId1,
    {
      title: "AWS Certified Developer",
      issuing_organization: "Amazon Web Services",
      category: "Cloud & DevOps",
      credential_id: "AWS-DEV-002",
      issue_date: "2025-06-01",
      does_not_expire: true,
    },
  );
  assert.equal(second.certification.expiry_date, null);

  // Update with does_not_expire=true clears previous expiry_date
  const updated = await service.updateCertification(
    { userId: studentId1, role: "Student" },
    studentId1,
    created.certification.id,
    { does_not_expire: true, expiry_date: "2028-02-01" },
  );
  assert.equal(updated.certification.expiry_date, null);
  assert.equal(updated.certification.does_not_expire, true);

  // Attach & replace certificate file removes old file
  await service.attachCertificateFile(
    { userId: studentId1, role: "Student" },
    studentId1,
    created.certification.id,
    { filename: "first.pdf", originalname: "aws.pdf", mimetype: "application/pdf", size: 1024 },
  );
  await service.attachCertificateFile(
    { userId: studentId1, role: "Student" },
    studentId1,
    created.certification.id,
    { filename: "second.pdf", originalname: "aws-v2.pdf", mimetype: "application/pdf", size: 2048 },
  );
  assert.ok(removedFiles.includes("first.pdf"));

  // Reorder
  const reordered = await service.reorderCertifications(
    { userId: studentId1, role: "Student" },
    studentId1,
    [
      { certification_id: second.certification.id, display_order: 0 },
      { certification_id: created.certification.id, display_order: 1 },
    ],
  );
  assert.equal(reordered.certifications[0].id, second.certification.id);

  // Search filter
  const searched = await service.listStudentCertifications(
    { userId: studentId1, role: "Student" },
    studentId1,
    { search: "AWS-DEV-002" },
  );
  assert.equal(searched.certifications.length, 1);

  // Delete cleans file and soft-deletes record
  await service.deleteCertification(
    { userId: studentId1, role: "Student" },
    studentId1,
    created.certification.id,
  );
  assert.equal(certsStore.find((c) => c._id === created.certification.id).is_deleted, true);
  assert.ok(removedFiles.includes("second.pdf"));
  assert.ok(auditLogs.some((a) => a.action === "CREATE_CERTIFICATION"));
  assert.ok(auditLogs.some((a) => a.action === "DELETE_CERTIFICATION"));
});
