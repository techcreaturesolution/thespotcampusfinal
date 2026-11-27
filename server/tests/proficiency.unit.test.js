import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  createSkillsService,
  getOrderedProficiencyLevels,
  resolveActiveProficiency,
} from "../src/modules/skills/skills.service.js";
import { createAcademicProfileService } from "../src/modules/academicProfile/academicProfile.service.js";
import { normalizeProficiencyValue } from "../src/scripts/migrateProficiencyLevels.js";

const studentId = new mongoose.Types.ObjectId().toString();
const collegeId = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const degreeId = new mongoose.Types.ObjectId().toString();
const skillJsId = new mongoose.Types.ObjectId().toString();
const skillPyId = new mongoose.Types.ObjectId().toString();

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

test("getOrderedProficiencyLevels returns deterministic order (not alphabetical)", () => {
  const ordered = getOrderedProficiencyLevels([
    { code: "EXPERT", name: "Expert", order: 4, is_active: true },
    { code: "BEGINNER", name: "Beginner", order: 1, is_active: true },
    { code: "ADVANCED", name: "Advanced", order: 3, is_active: true },
    { code: "INTERMEDIATE", name: "Intermediate", order: 2, is_active: true },
  ]);
  assert.deepEqual(
    ordered.map((l) => l.name),
    ["Beginner", "Intermediate", "Advanced", "Expert"],
  );
});

test("resolveActiveProficiency rejects inactive or unknown levels", () => {
  const levels = [
    { code: "BEGINNER", name: "Beginner", order: 1, is_active: true },
    { code: "LEGACY", name: "Legacy", order: 9, is_active: false },
  ];
  assert.equal(resolveActiveProficiency("beginner", levels)?.name, "Beginner");
  assert.equal(resolveActiveProficiency("Legacy", levels), null);
  assert.equal(resolveActiveProficiency("Random", levels), null);
});

test("normalizeProficiencyValue maps valid casing/codes and flags unknown values", () => {
  assert.equal(normalizeProficiencyValue("  advanced "), "Advanced");
  assert.equal(normalizeProficiencyValue("EXPERT"), "Expert");
  assert.equal(normalizeProficiencyValue(""), "Intermediate");
  assert.equal(normalizeProficiencyValue("Grandmaster"), null);
});

test("Proficiency update modifies existing association in-place, sorts deterministically, and logs audit", async () => {
  const skills = [
    { _id: skillJsId, name: "JavaScript", normalized_name: "javascript", category: "Programming Languages", is_active: true, is_deleted: false },
    { _id: skillPyId, name: "Python", normalized_name: "python", category: "Programming Languages", is_active: true, is_deleted: false },
  ];
  const userSkills = [];
  const auditLogs = [];
  const student = { _id: studentId, college_id: collegeId, university_id: uniId, degree_id: degreeId, student_skills: "", is_deleted: false };

  const accessService = createAcademicProfileService({
    Student: { findById: () => wrapQuery(student) },
  });

  const service = createSkillsService({
    skipAutoSeed: true,
    accessService,
    proficiencyLevels: [
      { code: "BEGINNER", name: "Beginner", order: 1, description: "", is_active: true },
      { code: "INTERMEDIATE", name: "Intermediate", order: 2, description: "", is_active: true },
      { code: "ADVANCED", name: "Advanced", order: 3, description: "", is_active: true },
      { code: "EXPERT", name: "Expert", order: 4, description: "", is_active: true },
      { code: "LEGACY", name: "Legacy", order: 5, description: "", is_active: false },
    ],
    Skill: {
      findOne: async (f) => skills.find((s) => String(s._id) === String(f._id)) || null,
    },
    StudentSkill: {
      countDocuments: async () => userSkills.filter((u) => !u.is_deleted).length,
      find: (f) => {
        const list = userSkills
          .filter((u) => !u.is_deleted && (!f.proficiency || u.proficiency === f.proficiency))
          .map((u) => ({
            ...u,
            skill_id: skills.find((s) => String(s._id) === String(u.skill_id)),
          }));
        return wrapQuery(list);
      },
      findOne: (f) => {
        const found =
          userSkills.find(
            (u) =>
              !u.is_deleted &&
              (!f._id || String(u._id) === String(f._id)) &&
              (!f.skill_id || String(u.skill_id) === String(f.skill_id)),
          ) || null;
        return wrapQuery(
          found ? { ...found, skill_id: skills.find((s) => String(s._id) === String(found.skill_id)) } : null,
        );
      },
      findById: (id) => {
        const found = userSkills.find((u) => String(u._id) === String(id)) || null;
        return wrapQuery(
          found ? { ...found, skill_id: skills.find((s) => String(s._id) === String(found.skill_id)) } : null,
        );
      },
      create: async (doc) => {
        const item = { _id: new mongoose.Types.ObjectId().toString(), ...doc };
        userSkills.push(item);
        return item;
      },
      findByIdAndUpdate: (id, update) => {
        const idx = userSkills.findIndex((u) => String(u._id) === String(id));
        userSkills[idx] = { ...userSkills[idx], ...(update.$set || update) };
        const updated = userSkills[idx];
        return wrapQuery({
          ...updated,
          skill_id: skills.find((s) => String(s._id) === String(updated.skill_id)),
        });
      },
    },
    Student: {
      findById: () => wrapQuery(student),
      findByIdAndUpdate: async () => student,
    },
    AuditLog: {
      create: async (doc) => {
        auditLogs.push(doc);
        return doc;
      },
    },
  });

  // Inactive proficiency rejected
  await assert.rejects(
    () =>
      service.addStudentSkill(
        { userId: studentId, role: "Student" },
        studentId,
        { skill_id: skillJsId, proficiency: "Legacy" },
      ),
    /Invalid or inactive/i,
  );

  const jsEntry = await service.addStudentSkill(
    { userId: studentId, role: "Student" },
    studentId,
    { skill_id: skillJsId, proficiency: "Intermediate" },
  );
  await service.addStudentSkill(
    { userId: studentId, role: "Student" },
    studentId,
    { skill_id: skillPyId, proficiency: "Expert" },
  );

  // Update JS Intermediate -> Advanced in-place (still only 2 records total!)
  const updated = await service.updateStudentSkill(
    { userId: studentId, role: "Student" },
    studentId,
    jsEntry.skill_entry.id,
    { proficiency: "Advanced" },
  );
  assert.equal(updated.skill_entry.id, jsEntry.skill_entry.id);
  assert.equal(updated.skill_entry.proficiency, "Advanced");
  assert.equal(updated.skill_entry.proficiency_order, 3);
  assert.equal(userSkills.length, 2);

  const profAudit = auditLogs.find((a) => a.action === "UPDATE_USER_SKILL_PROFICIENCY");
  assert.ok(profAudit);
  assert.equal(profAudit.previous_values.proficiency, "Intermediate");
  assert.equal(profAudit.new_values.proficiency, "Advanced");

  // Sort high-to-low -> Expert (Python) first, then Advanced (JavaScript)
  const desc = await service.getStudentSkills(
    { userId: studentId, role: "Student" },
    studentId,
    { sort: "proficiency_desc" },
  );
  assert.deepEqual(
    desc.skills.map((s) => s.skill.name),
    ["Python", "JavaScript"],
  );

  // Filter by Advanced -> only JavaScript
  const filtered = await service.getStudentSkills(
    { userId: studentId, role: "Student" },
    studentId,
    { proficiency: "Advanced" },
  );
  assert.equal(filtered.skills.length, 1);
  assert.equal(filtered.skills[0].skill.name, "JavaScript");
});
