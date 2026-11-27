import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  createProjectsService,
  validateProviderLink,
} from "../src/modules/projects/projects.service.js";
import { createAcademicProfileService } from "../src/modules/academicProfile/academicProfile.service.js";

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const degreeId1 = new mongoose.Types.ObjectId().toString();

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
  const projectLinksStore = [];
  const auditLogs = [];
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
    Skill: { find: () => wrapQuery([]), findOne: async () => null },
    ProjectSkill: { find: () => wrapQuery([]), findOne: () => wrapQuery(null) },
    Project: {
      countDocuments: async (f) =>
        projectsStore.filter((p) => String(p.student_id) === String(f.student_id) && !p.is_deleted).length,
      find: (f) =>
        wrapQuery(
          projectsStore.filter((p) => String(p.student_id) === String(f.student_id) && !p.is_deleted),
        ),
      findOne: (f) => {
        const found =
          projectsStore.find(
            (p) => String(p._id) === String(f._id) && String(p.student_id) === String(f.student_id) && !p.is_deleted,
          ) || null;
        return wrapQuery(found);
      },
      create: async (doc) => {
        const item = { _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date(), updatedAt: new Date(), ...doc };
        projectsStore.push(item);
        return item;
      },
    },
    ProjectLink: {
      countDocuments: async (f) =>
        projectLinksStore.filter((l) => String(l.project_id) === String(f.project_id) && !l.is_deleted).length,
      find: (f) => {
        const ids = f.project_id?.$in ? f.project_id.$in.map(String) : [String(f.project_id)];
        const res = projectLinksStore
          .filter((l) => ids.includes(String(l.project_id)) && !l.is_deleted)
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
      findByIdAndUpdate: (id, update) => {
        const idx = projectLinksStore.findIndex((l) => String(l._id) === String(id));
        if (idx === -1) return wrapQuery(null);
        projectLinksStore[idx] = { ...projectLinksStore[idx], ...(update.$set || update) };
        return wrapQuery(projectLinksStore[idx]);
      },
    },
    AuditLog: {
      create: async (doc) => {
        auditLogs.push(doc);
        return doc;
      },
    },
  });

  return { service, projectLinksStore, auditLogs };
};

test("validateProviderLink enforces strict GitHub host, path, and safe URL rules", () => {
  const gh = validateProviderLink("GITHUB_REPOSITORY", "https://github.com/TechCreature/thespotcampus");
  assert.equal(gh.link_type, "GITHUB_REPOSITORY");
  assert.equal(gh.normalized_url, "https://github.com/techcreature/thespotcampus");

  assert.throws(
    () => validateProviderLink("GITHUB_REPOSITORY", "https://github.com.attacker.example/org/repo"),
    /host must be one of/i,
  );
  assert.throws(
    () => validateProviderLink("GITHUB_REPOSITORY", "http://github.com/org/repo"),
    /must use https/i,
  );
  assert.throws(
    () => validateProviderLink("GITHUB_REPOSITORY", "https://github.com/onlyowner"),
    /valid repository/i,
  );
  assert.throws(
    () => validateProviderLink("LIVE_DEMO", "javascript:alert(1)"),
    /unsafe protocol/i,
  );
  assert.throws(
    () => validateProviderLink("LIVE_DEMO", "data:text/html,<script>"),
    /unsafe protocol/i,
  );
  assert.throws(
    () => validateProviderLink("INVALID_TYPE", "https://example.com"),
    /Unsupported project link type/i,
  );
});

test("ProjectLink CRUD prevents duplicates, second GitHub link, IDOR, and private leaks", async () => {
  const { service, projectLinksStore, auditLogs } = makeHarness();

  const createdProj = await service.createProject(
    { userId: studentId1, role: "Student" },
    studentId1,
    {
      title: "Portfolio App",
      description: "A full portfolio application with links",
      visibility: "Private",
    },
  );
  const projectId = createdProj.project.id;

  const ghLink = await service.addProjectLink(
    { userId: studentId1, role: "Student" },
    studentId1,
    projectId,
    { link_type: "GITHUB_REPOSITORY", url: "https://github.com/Prachi/SpotCampus/" },
  );
  assert.equal(ghLink.link.link_type, "GITHUB_REPOSITORY");

  // Duplicate normalized URL rejected
  await assert.rejects(
    () =>
      service.addProjectLink(
        { userId: studentId1, role: "Student" },
        studentId1,
        projectId,
        { link_type: "PROJECT_WEBSITE", url: "https://github.com/prachi/spotcampus" },
      ),
    /already linked/i,
  );

  // Second GitHub repository rejected
  await assert.rejects(
    () =>
      service.addProjectLink(
        { userId: studentId1, role: "Student" },
        studentId1,
        projectId,
        { link_type: "GITHUB_REPOSITORY", url: "https://github.com/Prachi/OtherRepo" },
      ),
    /only one canonical GitHub repository/i,
  );

  // Forged ownership rejected
  await assert.rejects(
    () =>
      service.addProjectLink(
        { userId: studentId1, role: "Student" },
        studentId1,
        projectId,
        { link_type: "LIVE_DEMO", url: "https://demo.example.com", student_id: studentId2 },
      ),
    /cannot be supplied in payload/i,
  );

  // Private project link read blocked for College
  await assert.rejects(
    () => service.listProjectLinks({ userId: collegeId1, role: "College" }, studentId1, projectId),
    /private/i,
  );

  // Cross-student IDOR blocked
  await assert.rejects(
    () =>
      service.deleteProjectLink(
        { userId: studentId2, role: "Student" },
        studentId1,
        projectId,
        ghLink.link.id,
      ),
    /only access your own/i,
  );

  // Update & soft delete
  const upd = await service.updateProjectLink(
    { userId: studentId1, role: "Student" },
    studentId1,
    projectId,
    ghLink.link.id,
    { label: "Main Repo" },
  );
  assert.equal(upd.link.label, "Main Repo");

  const del = await service.deleteProjectLink(
    { userId: studentId1, role: "Student" },
    studentId1,
    projectId,
    ghLink.link.id,
  );
  assert.equal(del.deleted, true);
  assert.equal(projectLinksStore[0].is_deleted, true);
  assert.ok(auditLogs.some((a) => a.action === "ADD_PROJECT_LINK"));
  assert.ok(auditLogs.some((a) => a.action === "UPDATE_PROJECT_LINK"));
  assert.ok(auditLogs.some((a) => a.action === "DELETE_PROJECT_LINK"));
});
