import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  createInternshipService,
  validateAndNormalizeInternshipLinks,
  validateInternshipDates,
} from "../src/modules/internships/internship.service.js";
import { createAcademicProfileService } from "../src/modules/academicProfile/academicProfile.service.js";

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const degreeId1 = new mongoose.Types.ObjectId().toString();
const skillNodeId = new mongoose.Types.ObjectId().toString();
const skillInactiveId = new mongoose.Types.ObjectId().toString();
const project1Id = new mongoose.Types.ObjectId().toString();
const projectPrivate1Id = new mongoose.Types.ObjectId().toString();
const project2Id = new mongoose.Types.ObjectId().toString();

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
  const internshipsStore = [];
  const auditLogs = [];

  const skillsStore = [
    { _id: skillNodeId, name: "Node.js", category: "Frameworks", is_active: true, is_deleted: false },
    { _id: skillInactiveId, name: "COBOL", category: "Other", is_active: false, is_deleted: false },
  ];

  const projectsStore = [
    {
      _id: project1Id,
      student_id: studentId1,
      title: "Campus ERP Portal",
      status: "Completed",
      visibility: "Public",
      is_deleted: false,
    },
    {
      _id: projectPrivate1Id,
      student_id: studentId1,
      title: "Secret Research Tool",
      status: "In Progress",
      visibility: "Private",
      is_deleted: false,
    },
    {
      _id: project2Id,
      student_id: studentId2,
      title: "Student 2 Private Project",
      status: "Completed",
      visibility: "Private",
      is_deleted: false,
    },
  ];

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

  const service = createInternshipService({
    accessService,
    Student: { findById: (id) => wrapQuery(students[String(id)] || null) },
    Skill: {
      find: (f) => {
        const ids = (f._id?.$in || []).map(String);
        const res = skillsStore.filter((s) => {
          if (!ids.includes(String(s._id)) || s.is_deleted) return false;
          if (f.is_active !== undefined && s.is_active !== f.is_active) return false;
          return true;
        });
        return wrapQuery(res);
      },
    },
    Project: {
      find: (f) => {
        const ids = (f._id?.$in || []).map(String);
        const res = projectsStore.filter(
          (p) =>
            ids.includes(String(p._id)) &&
            String(p.student_id) === String(f.student_id) &&
            !p.is_deleted,
        );
        return wrapQuery(res);
      },
    },
    Internship: {
      countDocuments: async (f) =>
        internshipsStore.filter(
          (i) =>
            String(i.student_id) === String(f.student_id) &&
            !i.is_deleted &&
            (!f.visibility?.$ne || i.visibility !== f.visibility.$ne),
        ).length,
      find: (f) => {
        const list = internshipsStore
          .filter((i) => {
            if (String(i.student_id) !== String(f.student_id) || i.is_deleted) return false;
            if (f.status && i.status !== f.status) return false;
            if (f.work_mode && i.work_mode !== f.work_mode) return false;
            if (f.visibility?.$ne && i.visibility === f.visibility.$ne) return false;
            return true;
          })
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        return wrapQuery(list);
      },
      findOne: (f) => {
        const found =
          internshipsStore.find((i) => {
            if (i.is_deleted) return false;
            if (f._id && typeof f._id === "string" && String(i._id) !== String(f._id)) return false;
            if (f._id?.$ne && String(i._id) === String(f._id.$ne)) return false;
            if (f.student_id && String(i.student_id) !== String(f.student_id)) return false;
            if (f.normalized_organization && i.normalized_organization !== f.normalized_organization)
              return false;
            if (f.normalized_role && i.normalized_role !== f.normalized_role) return false;
            if (f.start_date && new Date(i.start_date).getTime() !== new Date(f.start_date).getTime())
              return false;
            if (f.currently_working !== undefined && i.currently_working !== f.currently_working)
              return false;
            if (f.end_date !== undefined) {
              const targetEnd = f.end_date ? new Date(f.end_date).getTime() : null;
              const actualEnd = i.end_date ? new Date(i.end_date).getTime() : null;
              if (targetEnd !== actualEnd) return false;
            }
            return true;
          }) || null;

        if (!found) return wrapQuery(null);
        return wrapQuery({
          ...found,
          async save() {
            const idx = internshipsStore.findIndex((x) => String(x._id) === String(this._id));
            if (idx !== -1) internshipsStore[idx] = { ...internshipsStore[idx], ...this };
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
        internshipsStore.push(item);
        return item;
      },
      findByIdAndUpdate: (id, update) => {
        const idx = internshipsStore.findIndex((i) => String(i._id) === String(id));
        if (idx === -1) return wrapQuery(null);
        internshipsStore[idx] = { ...internshipsStore[idx], ...(update.$set || update) };
        return wrapQuery(internshipsStore[idx]);
      },
    },
    AuditLog: {
      create: async (doc) => {
        auditLogs.push(doc);
        return doc;
      },
    },
  });

  return { service, internshipsStore, auditLogs };
};

test("validateInternshipDates and validateAndNormalizeInternshipLinks enforce business & URL rules", () => {
  const valid = validateInternshipDates("2025-01-01", "2025-06-01", false);
  assert.ok(valid.start_date instanceof Date);
  assert.ok(valid.end_date instanceof Date);

  const current = validateInternshipDates("2025-05-01", "2024-01-01", true);
  assert.equal(current.end_date, null);

  assert.throws(
    () => validateInternshipDates("2025-05-01", null, false),
    /end_date is required/i,
  );
  assert.throws(
    () => validateInternshipDates("2025-05-01", "2025-02-01", false),
    /cannot be earlier/i,
  );

  const links = validateAndNormalizeInternshipLinks([
    { link_type: "VERIFICATION_PAGE", url: "https://verify.example.com/123", label: "Verify" },
  ]);
  assert.equal(links.length, 1);

  assert.throws(
    () => validateAndNormalizeInternshipLinks([{ link_type: "OTHER", url: "javascript:alert(1)" }]),
    /unsafe protocol/i,
  );
});

test("Internship CRUD handles skills, owned projects, concurrency, duplicates, mass assignment, and privacy", async () => {
  const { service, auditLogs } = makeHarness();

  // Reject Student1 trying to link Student2's project
  await assert.rejects(
    () =>
      service.createInternship({ userId: studentId1, role: "Student" }, studentId1, {
        role_title: "Backend Intern",
        organization_name: "Acme Corp",
        start_date: "2025-01-01",
        end_date: "2025-04-01",
        project_ids: [project2Id],
      }),
    /do not belong to the student/i,
  );

  // Reject mass assignment of protected keys
  await assert.rejects(
    () =>
      service.createInternship({ userId: studentId1, role: "Student" }, studentId1, {
        institute_id: collegeId2,
        role_title: "Backend Intern",
        organization_name: "Acme Corp",
        start_date: "2025-01-01",
        end_date: "2025-04-01",
      }),
    /cannot be supplied by client/i,
  );

  const created = await service.createInternship(
    { userId: studentId1, role: "Student" },
    studentId1,
    {
      role_title: "<script>Backend Intern</script>",
      organization_name: "Tech Creature Solution",
      work_mode: "Remote",
      start_date: "2025-01-01",
      currently_working: true,
      skill_ids: [skillNodeId],
      project_ids: [project1Id, projectPrivate1Id],
      visibility: "Public",
    },
  );
  assert.equal(created.internship.role_title, "Backend Intern");
  assert.equal(created.internship.end_date, null);
  assert.equal(created.internship.skills.length, 1);
  assert.equal(created.internship.projects.length, 2);

  // Concurrent / overlapping second internship IS allowed
  const overlap = await service.createInternship(
    { userId: studentId1, role: "Student" },
    studentId1,
    {
      role_title: "Part-Time Research Intern",
      organization_name: "OpenLab",
      employment_type: "Part-Time",
      start_date: "2025-02-01",
      currently_working: true,
    },
  );
  assert.ok(overlap.internship.id);

  // Exact duplicate blocked
  await assert.rejects(
    () =>
      service.createInternship({ userId: studentId1, role: "Student" }, studentId1, {
        role_title: "Backend Intern",
        organization_name: "tech creature solution",
        start_date: "2025-01-01",
        currently_working: true,
      }),
    /already exists/i,
  );

  // College1 reading Student1's Public internship MUST NOT see Student1's Private project inside projects[]
  const colView = await service.listStudentInternships(
    { userId: collegeId1, role: "College" },
    studentId1,
  );
  assert.equal(colView.internships.length, 2);
  const firstProjTitles = colView.internships[0].projects.map((p) => p.title);
  assert.ok(firstProjTitles.includes("Campus ERP Portal"));
  assert.ok(!firstProjTitles.includes("Secret Research Tool"));

  // Update currently_working=false requires end_date >= start_date
  await assert.rejects(
    () =>
      service.updateInternship(
        { userId: studentId1, role: "Student" },
        studentId1,
        created.internship.id,
        { currently_working: false },
      ),
    /end_date is required/i,
  );

  await service.deleteInternship(
    { userId: studentId1, role: "Student" },
    studentId1,
    created.internship.id,
  );
  assert.ok(auditLogs.some((a) => a.action === "CREATE_INTERNSHIP"));
  assert.ok(auditLogs.some((a) => a.action === "DELETE_INTERNSHIP"));
});
