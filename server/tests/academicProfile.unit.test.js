import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { calculateAcademicCompletion } from "../src/modules/academicProfile/academicProfile.completion.js";
import { createAcademicProfileService } from "../src/modules/academicProfile/academicProfile.service.js";
import { sanitizeAuditValues } from "../src/modules/audit/audit.service.js";

const id1 = new mongoose.Types.ObjectId().toString();
const id2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const colId1 = new mongoose.Types.ObjectId().toString();
const colId2 = new mongoose.Types.ObjectId().toString();
const degId1 = new mongoose.Types.ObjectId().toString();
const degId2 = new mongoose.Types.ObjectId().toString();
const brId1 = new mongoose.Types.ObjectId().toString();

const makePopulatedStudent = (overrides = {}) => ({
  _id: id1,
  student_name: "Prachi Makwana",
  student_email: "prachi@example.com",
  university_id: { _id: uniId, university_name: "GTU" },
  college_id: { _id: colId1, college_name: "Alpha Engineering", college_university_id: uniId },
  degree_id: { _id: degId1, degree_name: "B.Tech", degree_code: "BT", degree_sem: "8", college_id: colId1 },
  branch_id: { _id: brId1, branch_name: "Computer Engineering", degree_id: degId1, college_id: colId1 },
  student_enrollment: "220170107001",
  student_current_sem: "6",
  student_total_backlog: "0",
  academic_year: "2025-26",
  academic_batch: "2022-2026",
  academic_status: "Active",
  cgpa: 8.6,
  percentage: null,
  admission_year: 2022,
  expected_graduation_year: 2026,
  isVerifiedByTPO: false,
  academic_profile_initialized: true,
  is_deleted: false,
  toJSON() {
    return { ...this };
  },
  ...overrides,
});

const makeDeps = (overrides = {}) => {
  const auditLogs = [];
  const historyRecords = [];
  let currentStudent = overrides.student || makePopulatedStudent();

  const wrapQuery = (result) => {
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
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return q;
  };

  return {
    auditLogs,
    historyRecords,
    deps: {
      Student: {
        findById: (id) => wrapQuery(String(id) === String(currentStudent._id) ? currentStudent : null),
        findOne: (query) => wrapQuery(overrides.duplicateStudent || null),
        findByIdAndUpdate: (id, update) => {
          currentStudent = {
            ...currentStudent,
            ...(update.$set || update),
            toJSON() {
              return { ...this };
            },
          };
          return wrapQuery(currentStudent);
        },
      },
      Tpo: {
        findById: async () =>
          overrides.tpo || { _id: id2, tpo_college_id: colId1, tpo_degree_id: degId1 },
      },
      University: {
        findById: async (id) => (String(id) === uniId ? { _id: uniId, university_name: "GTU" } : null),
      },
      College: {
        findById: async (id) => {
          if (String(id) === colId1) return { _id: colId1, college_university_id: uniId };
          if (String(id) === colId2) return { _id: colId2, college_university_id: id2 };
          return null;
        },
      },
      Degree: {
        findById: async (id) => {
          if (String(id) === degId1) return { _id: degId1, college_id: colId1, degree_sem: "8" };
          if (String(id) === degId2) return { _id: degId2, college_id: colId2, degree_sem: "8" };
          return null;
        },
      },
      Branch: {
        findById: async (id) =>
          String(id) === brId1 ? { _id: brId1, degree_id: degId1, college_id: colId1 } : null,
      },
      AcademicHistory: {
        countDocuments: async () => historyRecords.filter((h) => !h.is_deleted).length,
        find: () => wrapQuery(historyRecords.filter((h) => !h.is_deleted)),
        findOne: async (query) => {
          if (query._id) {
            return (
              historyRecords.find(
                (h) => String(h._id) === String(query._id) && !h.is_deleted,
              ) || null
            );
          }
          return overrides.duplicateHistory || null;
        },
        create: async (doc) => {
          const item = {
            _id: new mongoose.Types.ObjectId().toString(),
            ...doc,
            async save() {
              return this;
            },
          };
          historyRecords.push(item);
          return item;
        },
        findByIdAndUpdate: async (id, update) => {
          const idx = historyRecords.findIndex((h) => String(h._id) === String(id));
          if (idx === -1) return null;
          historyRecords[idx] = { ...historyRecords[idx], ...(update.$set || update) };
          return historyRecords[idx];
        },
      },
      AuditLog: {
        create: async (doc) => {
          auditLogs.push(doc);
          return doc;
        },
        find: () => wrapQuery(auditLogs),
        countDocuments: async () => auditLogs.length,
      },
    },
  };
};

test("calculateAcademicCompletion computes accurate percentages and missing fields", () => {
  const empty = calculateAcademicCompletion({}, 0);
  assert.equal(empty.percentage, 0);
  assert.equal(empty.completed_count, 0);
  assert.equal(empty.total_fields, 10);
  assert.equal(empty.is_complete, false);

  const partial = calculateAcademicCompletion(makePopulatedStudent(), 0);
  assert.equal(partial.completed_count, 9);
  assert.equal(partial.percentage, 90);
  assert.deepEqual(
    partial.missing_fields.map((f) => f.key),
    ["academic_history"],
  );

  const full = calculateAcademicCompletion(makePopulatedStudent(), 2);
  assert.equal(full.percentage, 100);
  assert.equal(full.is_complete, true);
});

test("sanitizeAuditValues strips sensitive authentication keys", () => {
  const cleaned = sanitizeAuditValues({
    student_current_sem: "7",
    student_password: "secret",
    token: "jwt-token",
  });
  assert.deepEqual(cleaned, { student_current_sem: "7" });
});

test("RBAC & IDOR checks enforce ownership and college/TPO/university boundaries", async () => {
  const { deps } = makeDeps();
  const service = createAcademicProfileService(deps);

  // Student accessing another student -> 403
  await assert.rejects(
    () => service.getAcademicProfile({ userId: id2, role: "Student" }, id1),
    /only access your own academic profile/i,
  );

  // Company blocked -> 403
  await assert.rejects(
    () => service.getAcademicProfile({ userId: id2, role: "Company" }, id1),
    /not authorized/i,
  );

  // Cross-college College -> 403
  await assert.rejects(
    () => service.getAcademicProfile({ userId: colId2, role: "College" }, id1),
    /Cross-college/i,
  );

  // Same-college College -> allowed
  const collegeView = await service.getAcademicProfile({ userId: colId1, role: "College" }, id1);
  assert.equal(collegeView.academic_profile.student_id, id1);

  // University read allowed, write denied
  const uniView = await service.getAcademicProfile({ userId: uniId, role: "University" }, id1);
  assert.equal(uniView.academic_profile.student_enrollment, "220170107001");
  await assert.rejects(
    () => service.updateAcademicProfile({ userId: uniId, role: "University" }, id1, { student_current_sem: "7" }),
    /read-only access/i,
  );
});

test("TPO scoping enforces both college and assigned degree program", async () => {
  const { deps } = makeDeps({
    tpo: { _id: id2, tpo_college_id: colId1, tpo_degree_id: degId2 },
  });
  const service = createAcademicProfileService(deps);

  await assert.rejects(
    () => service.getAcademicProfile({ userId: id2, role: "TPO" }, id1),
    /assigned degree program/i,
  );
});

test("Verified student cannot modify locked institutional fields or mass-assign protected fields", async () => {
  const { deps, auditLogs } = makeDeps({
    student: makePopulatedStudent({ isVerifiedByTPO: true }),
  });
  const service = createAcademicProfileService(deps);

  await assert.rejects(
    () =>
      service.updateAcademicProfile({ userId: id1, role: "Student" }, id1, {
        isVerifiedByTPO: false,
      }),
    /cannot be modified directly/i,
  );

  await assert.rejects(
    () =>
      service.updateAcademicProfile({ userId: id1, role: "Student" }, id1, {
        student_enrollment: "HACKED999",
      }),
    /locked after TPO verification/i,
  );

  const res = await service.updateAcademicProfile({ userId: id1, role: "Student" }, id1, {
    student_current_sem: "7",
    cgpa: 8.9,
  });
  assert.equal(res.academic_profile.student_current_sem, "7");
  assert.equal(res.academic_profile.cgpa, 8.9);
  assert.equal(auditLogs.length, 1);
  assert.equal(auditLogs[0].action, "UPDATE_ACADEMIC_PROFILE");
});

test("Relationship and duplicate enrollment validation rejects invalid combinations", async () => {
  const { deps } = makeDeps({
    duplicateStudent: { _id: id2 },
  });
  const service = createAcademicProfileService(deps);

  await assert.rejects(
    () =>
      service.updateAcademicProfile({ userId: id1, role: "Admin" }, id1, {
        college_id: colId2,
      }),
    /does not belong to the selected university/i,
  );

  await assert.rejects(
    () =>
      service.updateAcademicProfile({ userId: id1, role: "Admin" }, id1, {
        student_current_sem: "12",
      }),
    /Current semester must be an integer between 1 and 8/i,
  );

  await assert.rejects(
    () =>
      service.updateAcademicProfile({ userId: id1, role: "Admin" }, id1, {
        student_enrollment: "220170107002",
      }),
    /already assigned to another student/i,
  );
});

test("Academic history CRUD enforces validation, locked-record protection, and soft deletion", async () => {
  const { deps, auditLogs, historyRecords } = makeDeps();
  const service = createAcademicProfileService(deps);

  await assert.rejects(
    () =>
      service.addAcademicHistory({ userId: id1, role: "Student" }, id1, {
        stage_type: "12th",
        institution_name: "Gujarat High School",
        start_year: 2022,
        end_year: 2020,
      }),
    /End year cannot be earlier/i,
  );

  const added = await service.addAcademicHistory({ userId: id1, role: "Student" }, id1, {
    stage_type: "12th",
    institution_name: "Gujarat High School",
    start_year: 2020,
    end_year: 2022,
    score_type: "Percentage",
    score_value: "88.5",
  });
  assert.equal(added.completion.percentage, 100);
  assert.equal(historyRecords.length, 1);

  const historyId = added.entry._id;
  const updated = await service.updateAcademicHistory(
    { userId: id1, role: "Student" },
    id1,
    historyId,
    { score_value: "89.0" },
  );
  assert.equal(updated.entry.score_value, "89.0");

  // Lock the record as staff and verify student cannot delete it
  historyRecords[0].is_locked = true;
  await assert.rejects(
    () => service.deleteAcademicHistory({ userId: id1, role: "Student" }, id1, historyId),
    /cannot be deleted/i,
  );

  // Admin can soft-delete
  const del = await service.deleteAcademicHistory({ userId: id2, role: "Admin" }, id1, historyId);
  assert.equal(del.deleted, true);
  assert.equal(historyRecords[0].is_deleted, true);
  assert.ok(auditLogs.some((l) => l.action === "DELETE_ACADEMIC_HISTORY"));
});
