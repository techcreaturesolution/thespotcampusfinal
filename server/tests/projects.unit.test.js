import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  createProjectsService,
  sanitizePlainText,
  validateAndNormalizeProjectUrl,
} from "../src/modules/projects/projects.service.js";
import { createAcademicProfileService } from "../src/modules/academicProfile/academicProfile.service.js";

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const degreeId1 = new mongoose.Types.ObjectId().toString();
const skillReactId = new mongoose.Types.ObjectId().toString();
const skillInactiveId = new mongoose.Types.ObjectId().toString();

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

const makeHarness = () => {
  const projectsStore = [];
  const projectSkillsStore = [];
  const projectLinksStore = [];
  const auditLogs = [];
  const skillsStore = [
    { _id: skillReactId, name: "React", category: "Frameworks", is_active: true, is_deleted: false },
    { _id: skillInactiveId, name: "Flash", category: "Other", is_active: false, is_deleted: false },
  ];
  const students = {
    [studentId1]: { _id: studentId1, college_id: collegeId1, university_id: uniId, degree_id: degreeId1, is_deleted: false },
    [studentId2]: { _id: studentId2, college_id: collegeId2, university_id: uniId, degree_id: degreeId1, is_deleted: false },
  };

  const accessService = createAcademicProfileService({
    Student: { findById: (id) => wrapQuery(students[String(id)] || null) },
  });

  const service = createProjectsService({
    accessService,
    Student: { findById: (id) => wrapQuery(students[String(id)] || null) },
    Skill: {
      find: (f) => {
        const ids = (f._id?.$in || []).map(String);
        const res = skillsStore.filter(
          (s) => ids.includes(String(s._id)) && !s.is_deleted && s.is_active,
        );
        return wrapQuery(res);
      },
      findOne: async (f) =>
        skillsStore.find((s) => String(s._id) === String(f._id) && !s.is_deleted) || null,
    },
    Project: {
      countDocuments: async (f) =>
        projectsStore.filter(
          (p) =>
            String(p.student_id) === String(f.student_id) &&
            !p.is_deleted &&
            (!f.visibility?.$ne || p.visibility !== f.visibility.$ne),
        ).length,
      find: (f) => {
        const list = projectsStore
          .filter(
            (p) =>
              String(p.student_id) === String(f.student_id) &&
              !p.is_deleted &&
              (!f.status || p.status === f.status) &&
              (!f.visibility?.$ne || p.visibility !== f.visibility.$ne),
          )
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        return wrapQuery(list);
      },
      findOne: (f) => {
        const found =
          projectsStore.find(
            (p) =>
              String(p._id) === String(f._id) &&
              String(p.student_id) === String(f.student_id) &&
              !p.is_deleted,
          ) || null;
        if (!found) return wrapQuery(null);
        return wrapQuery({
          ...found,
          async save() {
            const idx = projectsStore.findIndex((x) => String(x._id) === String(this._id));
            if (idx !== -1) projectsStore[idx] = { ...projectsStore[idx], ...this };
            return this;
          },
        });
      },
      create: async (doc) => {
        const item = { _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date(), updatedAt: new Date(), ...doc };
        projectsStore.push(item);
        return item;
      },
      findByIdAndUpdate: (id, update) => {
        const idx = projectsStore.findIndex((p) => String(p._id) === String(id));
        if (idx === -1) return wrapQuery(null);
        projectsStore[idx] = { ...projectsStore[idx], ...(update.$set || update) };
        return wrapQuery(projectsStore[idx]);
      },
    },
    ProjectSkill: {
      find: (f) => {
        const projectIds = f.project_id?.$in
          ? f.project_id.$in.map(String)
          : f.project_id
            ? [String(f.project_id)]
            : [];
        const res = projectSkillsStore
          .filter((ps) => projectIds.includes(String(ps.project_id)) && !ps.is_deleted)
          .map((ps) => ({
            ...ps,
            skill_id: skillsStore.find((s) => String(s._id) === String(ps.skill_id)) || ps.skill_id,
            async save() {
              const idx = projectSkillsStore.findIndex((x) => String(x._id) === String(this._id));
              if (idx !== -1) projectSkillsStore[idx] = { ...projectSkillsStore[idx], ...this, skill_id: ps.skill_id };
              return this;
            },
          }));
        return wrapQuery(res);
      },
      findOne: (f) => {
        const found =
          projectSkillsStore.find(
            (ps) =>
              String(ps.project_id) === String(f.project_id) &&
              String(ps.skill_id) === String(f.skill_id) &&
              !ps.is_deleted,
          ) || null;
        if (!found) return wrapQuery(null);
        return wrapQuery({
          ...found,
          async save() {
            const idx = projectSkillsStore.findIndex((x) => String(x._id) === String(this._id));
            if (idx !== -1) projectSkillsStore[idx] = { ...projectSkillsStore[idx], ...this };
            return this;
          },
        });
      },
      create: async (doc) => {
        const item = { _id: new mongoose.Types.ObjectId().toString(), ...doc };
        projectSkillsStore.push(item);
        return item;
      },
    },
    ProjectLink: {
      find: (f) => {
        const projectIds = f.project_id?.$in
          ? f.project_id.$in.map(String)
          : f.project_id
            ? [String(f.project_id)]
            : [];
        const res = projectLinksStore
          .filter((l) => projectIds.includes(String(l.project_id)) && !l.is_deleted)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map((l) => ({
            ...l,
            async save() {
              const idx = projectLinksStore.findIndex((x) => String(x._id) === String(this._id));
              if (idx !== -1) projectLinksStore[idx] = { ...projectLinksStore[idx], ...this };
              return this;
            },
          }));
        return wrapQuery(res);
      },
      findOne: (f) => {
        const found =
          projectLinksStore.find((l) => {
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
            const idx = projectLinksStore.findIndex((x) => String(x._id) === String(this._id));
            if (idx !== -1) projectLinksStore[idx] = { ...projectLinksStore[idx], ...this };
            return this;
          },
        });
      },
      create: async (doc) => {
        const item = { _id: new mongoose.Types.ObjectId().toString(), updatedAt: new Date(), ...doc };
        projectLinksStore.push(item);
        return item;
      },
      countDocuments: async (f) =>
        projectLinksStore.filter((l) => String(l.project_id) === String(f.project_id) && !l.is_deleted).length,
    },
    AuditLog: {
      create: async (doc) => {
        auditLogs.push(doc);
        return doc;
      },
    },
  });

  return { service, projectsStore, projectSkillsStore, auditLogs };
};

test("sanitizePlainText removes HTML tags and validateAndNormalizeProjectUrl blocks unsafe protocols", () => {
  assert.equal(sanitizePlainText("<script>alert(1)</script>Campus App"), "alert(1)Campus App");
  assert.equal(validateAndNormalizeProjectUrl("https://github.com/org/repo"), "https://github.com/org/repo");
  assert.throws(() => validateAndNormalizeProjectUrl("javascript:alert(1)"), /unsafe protocol/i);
  assert.throws(() => validateAndNormalizeProjectUrl("data:text/html,hi"), /unsafe protocol/i);
  assert.throws(() => validateAndNormalizeProjectUrl("not-a-url"), /valid http or https/i);
});

test("createProject validates dates, ongoing behavior, ownership, and links canonical skills", async () => {
  const { service, auditLogs } = makeHarness();

  await assert.rejects(
    () =>
      service.createProject(
        { userId: studentId1, role: "Student" },
        studentId1,
        {
          title: "Bad Dates",
          description: "Valid description with enough characters",
          start_date: "2025-05-01",
          end_date: "2024-01-01",
        },
      ),
    /end_date cannot be earlier/i,
  );

  await assert.rejects(
    () =>
      service.createProject(
        { userId: studentId1, role: "Student" },
        studentId1,
        {
          title: "Forged",
          description: "Valid description with enough characters",
          student_id: studentId2,
        },
      ),
    /cannot be supplied in payload/i,
  );

  const res = await service.createProject(
    { userId: studentId1, role: "Student" },
    studentId1,
    {
      title: "<b>Spot Campus Portal</b>",
      description: "<p>Full stack placement portal with AI proctoring</p>",
      role: "Lead Developer",
      status: "In Progress",
      visibility: "Private",
      is_ongoing: true,
      start_date: "2025-01-10",
      end_date: "2025-12-01",
      repository_url: "https://github.com/tech/spot",
      skill_ids: [skillReactId, skillReactId],
    },
  );

  assert.equal(res.project.title, "Spot Campus Portal");
  assert.equal(res.project.end_date, null);
  assert.equal(res.project.skills.length, 1);
  assert.equal(res.project.skills[0].name, "React");
  assert.equal(res.project.skills[0].proficiency, undefined);
  assert.ok(auditLogs.some((a) => a.action === "CREATE_PROJECT"));
});

test("Visibility, IDOR, skill association, and soft delete rules work as required", async () => {
  const { service, projectsStore, projectSkillsStore } = makeHarness();

  const created = await service.createProject(
    { userId: studentId1, role: "Student" },
    studentId1,
    {
      title: "Private Draft",
      description: "Secret hackathon prototype description",
      visibility: "Private",
    },
  );
  const projectId = created.project.id;

  // College cannot see Private project
  const collegeList = await service.listStudentProjects(
    { userId: collegeId1, role: "College" },
    studentId1,
  );
  assert.equal(collegeList.projects.length, 0);

  await assert.rejects(
    () => service.getProjectById({ userId: collegeId1, role: "College" }, studentId1, projectId),
    /private/i,
  );

  // Cross-student IDOR blocked
  await assert.rejects(
    () => service.getProjectById({ userId: studentId2, role: "Student" }, studentId1, projectId),
    /only access your own/i,
  );

  // Add/duplicate/inactive skill checks
  await service.addSkillToProject({ userId: studentId1, role: "Student" }, studentId1, projectId, skillReactId);
  await assert.rejects(
    () => service.addSkillToProject({ userId: studentId1, role: "Student" }, studentId1, projectId, skillReactId),
    /already associated/i,
  );
  await assert.rejects(
    () => service.addSkillToProject({ userId: studentId1, role: "Student" }, studentId1, projectId, skillInactiveId),
    /Inactive skill/i,
  );

  // Soft delete cascades to project-skill links
  const del = await service.deleteProject({ userId: studentId1, role: "Student" }, studentId1, projectId);
  assert.equal(del.deleted, true);
  assert.equal(projectsStore[0].is_deleted, true);
  assert.equal(projectSkillsStore[0].is_deleted, true);
});
