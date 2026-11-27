import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { normalizeSkillName } from "../src/modules/skills/skill.model.js";
import { createSkillsService } from "../src/modules/skills/skills.service.js";
import { createAcademicProfileService } from "../src/modules/academicProfile/academicProfile.service.js";

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const collegeId2 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const degreeId1 = new mongoose.Types.ObjectId().toString();
const degreeId2 = new mongoose.Types.ObjectId().toString();
const tpoId = new mongoose.Types.ObjectId().toString();
const adminId = new mongoose.Types.ObjectId().toString();

const makeHarness = () => {
  const skillsStore = [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      name: "JavaScript",
      normalized_name: "javascript",
      category: "Programming Languages",
      is_active: true,
      is_deleted: false,
      async save() {
        return this;
      },
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      name: "React",
      normalized_name: "react",
      category: "Frameworks",
      is_active: true,
      is_deleted: false,
      async save() {
        return this;
      },
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      name: "Flash ActionScript",
      normalized_name: "flash actionscript",
      category: "Other",
      is_active: false,
      is_deleted: false,
      async save() {
        return this;
      },
    },
  ];
  const userSkillsStore = [];
  const auditLogs = [];
  const students = {
    [studentId1]: {
      _id: studentId1,
      college_id: collegeId1,
      university_id: uniId,
      degree_id: degreeId1,
      student_skills: "",
      is_deleted: false,
    },
    [studentId2]: {
      _id: studentId2,
      college_id: collegeId2,
      university_id: uniId,
      degree_id: degreeId2,
      student_skills: "",
      is_deleted: false,
    },
  };

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

  const accessService = createAcademicProfileService({
    Student: { findById: (id) => wrapQuery(students[String(id)] || null) },
    Tpo: {
      findById: async () => ({
        _id: tpoId,
        tpo_college_id: collegeId1,
        tpo_degree_id: degreeId1,
      }),
    },
  });

  const deps = {
    skipAutoSeed: true,
    accessService,
    Skill: {
      countDocuments: async (filter) =>
        skillsStore.filter(
          (s) =>
            !s.is_deleted &&
            (filter?.is_active === undefined || s.is_active === filter.is_active) &&
            (!filter?.category || s.category === filter.category),
        ).length,
      find: (filter) => {
        const res = skillsStore.filter((s) => {
          if (filter?.is_deleted === false && s.is_deleted) return false;
          if (filter?.is_active === true && !s.is_active) return false;
          if (filter?.category && s.category !== filter.category) return false;
          if (filter?.$or) {
            const regex = filter.$or[0]?.normalized_name;
            if (regex && !regex.test(s.normalized_name) && !regex.test(s.name)) return false;
          }
          return true;
        });
        return wrapQuery(res);
      },
      findOne: async (filter) => {
        return (
          skillsStore.find((s) => {
            if (filter._id && typeof filter._id === "string" && String(s._id) !== String(filter._id))
              return false;
            if (filter._id?.$ne && String(s._id) === String(filter._id.$ne)) return false;
            if (filter.normalized_name && s.normalized_name !== filter.normalized_name) return false;
            if (filter.is_deleted === false && s.is_deleted) return false;
            return true;
          }) || null
        );
      },
      create: async (doc) => {
        const item = {
          _id: new mongoose.Types.ObjectId().toString(),
          ...doc,
          async save() {
            return this;
          },
        };
        skillsStore.push(item);
        return item;
      },
      findByIdAndUpdate: async (id, update) => {
        const idx = skillsStore.findIndex((s) => String(s._id) === String(id));
        if (idx === -1) return null;
        skillsStore[idx] = { ...skillsStore[idx], ...(update.$set || update) };
        return skillsStore[idx];
      },
    },
    StudentSkill: {
      countDocuments: async (filter) =>
        userSkillsStore.filter(
          (u) => String(u.student_id) === String(filter.student_id) && !u.is_deleted,
        ).length,
      find: (filter) => {
        const list = userSkillsStore
          .filter((u) => String(u.student_id) === String(filter.student_id) && !u.is_deleted)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map((u) => ({
            ...u,
            skill_id: skillsStore.find((s) => String(s._id) === String(u.skill_id)) || u.skill_id,
          }));
        return wrapQuery(list);
      },
      findOne: (filter) => {
        const found =
          userSkillsStore.find((u) => {
            if (filter._id && String(u._id) !== String(filter._id)) return false;
            if (filter.student_id && String(u.student_id) !== String(filter.student_id)) return false;
            if (filter.skill_id && String(u.skill_id) !== String(filter.skill_id)) return false;
            if (filter.is_deleted === false && u.is_deleted) return false;
            return true;
          }) || null;
        if (!found) return wrapQuery(null);
        return wrapQuery({
          ...found,
          skill_id: skillsStore.find((s) => String(s._id) === String(found.skill_id)) || found.skill_id,
          async save() {
            const idx = userSkillsStore.findIndex((x) => String(x._id) === String(this._id));
            if (idx !== -1) userSkillsStore[idx] = { ...userSkillsStore[idx], ...this, skill_id: found.skill_id };
            return this;
          },
        });
      },
      findById: (id) => {
        const found = userSkillsStore.find((u) => String(u._id) === String(id)) || null;
        if (!found) return wrapQuery(null);
        return wrapQuery({
          ...found,
          skill_id: skillsStore.find((s) => String(s._id) === String(found.skill_id)) || found.skill_id,
        });
      },
      create: async (doc) => {
        const created = {
          _id: new mongoose.Types.ObjectId().toString(),
          updatedAt: new Date(),
          ...doc,
        };
        userSkillsStore.push(created);
        return created;
      },
      findByIdAndUpdate: (id, update) => {
        const idx = userSkillsStore.findIndex((u) => String(u._id) === String(id));
        if (idx === -1) return wrapQuery(null);
        userSkillsStore[idx] = { ...userSkillsStore[idx], ...(update.$set || update) };
        const updated = userSkillsStore[idx];
        return wrapQuery({
          ...updated,
          skill_id: skillsStore.find((s) => String(s._id) === String(updated.skill_id)) || updated.skill_id,
        });
      },
    },
    Student: {
      findById: (id) => wrapQuery(students[String(id)] || null),
      findByIdAndUpdate: async (id, update) => {
        if (students[String(id)]) {
          students[String(id)] = { ...students[String(id)], ...(update.$set || update) };
        }
        return students[String(id)];
      },
    },
    AuditLog: {
      create: async (doc) => {
        auditLogs.push(doc);
        return doc;
      },
    },
  };

  return {
    skillsStore,
    userSkillsStore,
    auditLogs,
    students,
    service: createSkillsService(deps),
  };
};

test("normalizeSkillName canonicalizes spacing and casing", () => {
  assert.equal(normalizeSkillName("  JavaScript  "), "javascript");
  assert.equal(normalizeSkillName("JAVASCRIPT"), "javascript");
  assert.equal(normalizeSkillName("Node   JS"), "node js");
});

test("createMasterSkill enforces authorization and case-insensitive uniqueness", async () => {
  const { service } = makeHarness();

  await assert.rejects(
    () => service.createMasterSkill({ userId: studentId1, role: "Student" }, { name: "Rust" }),
    /Only Admin, College, or TPO/i,
  );

  await assert.rejects(
    () => service.createMasterSkill({ userId: adminId, role: "Admin" }, { name: "  javascript " }),
    /already exists in canonical catalog/i,
  );

  const created = await service.createMasterSkill(
    { userId: adminId, role: "Admin" },
    { name: "Docker", category: "DevOps" },
  );
  assert.equal(created.skill.normalized_name, "docker");
});

test("User skill CRUD validates inactive skills, duplicates, proficiency, reordering, and syncs cache", async () => {
  const { service, skillsStore, students, auditLogs } = makeHarness();
  const jsSkill = skillsStore[0];
  const reactSkill = skillsStore[1];
  const inactiveSkill = skillsStore[2];

  // Inactive skill rejected
  await assert.rejects(
    () =>
      service.addStudentSkill(
        { userId: studentId1, role: "Student" },
        studentId1,
        { skill_id: inactiveSkill._id, proficiency: "Beginner" },
      ),
    /currently inactive/i,
  );

  // Invalid proficiency rejected
  await assert.rejects(
    () =>
      service.addStudentSkill(
        { userId: studentId1, role: "Student" },
        studentId1,
        { skill_id: jsSkill._id, proficiency: "Guru" },
      ),
    /Invalid or inactive skill proficiency/i,
  );

  // Forged ownership rejected
  await assert.rejects(
    () =>
      service.addStudentSkill(
        { userId: studentId1, role: "Student" },
        studentId1,
        { skill_id: jsSkill._id, college_id: collegeId2 },
      ),
    /cannot be supplied in payload/i,
  );

  // Add JS + React
  const added1 = await service.addStudentSkill(
    { userId: studentId1, role: "Student" },
    studentId1,
    { skill_id: jsSkill._id, proficiency: "Intermediate", years_of_experience: 1.5 },
  );
  assert.equal(added1.skill_entry.skill.name, "JavaScript");

  // Duplicate rejected
  await assert.rejects(
    () =>
      service.addStudentSkill(
        { userId: studentId1, role: "Student" },
        studentId1,
        { skill_id: jsSkill._id, proficiency: "Expert" },
      ),
    /already added to this profile/i,
  );

  const added2 = await service.addStudentSkill(
    { userId: studentId1, role: "Student" },
    studentId1,
    { skill_id: reactSkill._id, proficiency: "Advanced" },
  );
  assert.equal(students[studentId1].student_skills, "JavaScript, React");

  // Reorder React before JavaScript
  const reordered = await service.reorderStudentSkills(
    { userId: studentId1, role: "Student" },
    studentId1,
    [
      { user_skill_id: added2.skill_entry.id, display_order: 0 },
      { user_skill_id: added1.skill_entry.id, display_order: 1 },
    ],
  );
  assert.equal(reordered.skills[0].skill.name, "React");
  assert.equal(students[studentId1].student_skills, "React, JavaScript");

  // Update proficiency + soft delete
  const updated = await service.updateStudentSkill(
    { userId: studentId1, role: "Student" },
    studentId1,
    added1.skill_entry.id,
    { proficiency: "Advanced" },
  );
  assert.equal(updated.skill_entry.proficiency, "Advanced");

  const removed = await service.removeStudentSkill(
    { userId: studentId1, role: "Student" },
    studentId1,
    added1.skill_entry.id,
  );
  assert.equal(removed.deleted, true);
  assert.equal(students[studentId1].student_skills, "React");
  assert.ok(auditLogs.some((l) => l.action === "REMOVE_USER_SKILL"));
});

test("RBAC & college/TPO/university isolation blocks cross-tenant and IDOR skill access", async () => {
  const { service, skillsStore } = makeHarness();
  const jsSkill = skillsStore[0];

  await assert.rejects(
    () => service.getStudentSkills({ userId: studentId1, role: "Student" }, studentId2),
    /only access your own/i,
  );

  await assert.rejects(
    () => service.getStudentSkills({ userId: collegeId2, role: "College" }, studentId1),
    /Cross-college/i,
  );

  await assert.rejects(
    () =>
      service.addStudentSkill(
        { userId: uniId, role: "University" },
        studentId1,
        { skill_id: jsSkill._id, proficiency: "Intermediate" },
      ),
    /read-only access/i,
  );

  await assert.rejects(
    () => service.getStudentSkills({ userId: tpoId, role: "TPO" }, studentId2),
    /assigned college/i,
  );
});
