import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  createResumeVersionService,
  escapeHtmlAndTemplateTokens,
  normalizeSectionConfig,
} from "../src/modules/resumeVersions/resumeVersion.service.js";
import { createAcademicProfileService } from "../src/modules/academicProfile/academicProfile.service.js";
import { MAX_RESUME_VERSIONS_PER_STUDENT } from "../src/utils/constants.js";

const studentId1 = new mongoose.Types.ObjectId().toString();
const studentId2 = new mongoose.Types.ObjectId().toString();
const collegeId1 = new mongoose.Types.ObjectId().toString();
const uniId = new mongoose.Types.ObjectId().toString();
const degreeId1 = new mongoose.Types.ObjectId().toString();
const skillAssoc1Id = new mongoose.Types.ObjectId().toString();
const skillAssoc2Id = new mongoose.Types.ObjectId().toString();
const project1Id = new mongoose.Types.ObjectId().toString();
const projectArchived1Id = new mongoose.Types.ObjectId().toString();
const project2Id = new mongoose.Types.ObjectId().toString();
const cert1Id = new mongoose.Types.ObjectId().toString();
const cert2Id = new mongoose.Types.ObjectId().toString();
const intern1Id = new mongoose.Types.ObjectId().toString();
const intern2Id = new mongoose.Types.ObjectId().toString();
const edu1Id = new mongoose.Types.ObjectId().toString();
const edu2Id = new mongoose.Types.ObjectId().toString();
const templateId = new mongoose.Types.ObjectId().toString();

const wrapQuery = (result) => {
  const q = {
    populate() {
      return q;
    },
    select() {
      return q;
    },
    sort() {
      return q;
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return q;
};

const makeHarness = () => {
  const versionsStore = [];
  const auditLogs = [];

  const students = {
    [studentId1]: {
      _id: studentId1,
      student_name: "Prachi <script>alert(1)</script>",
      student_email: "prachi@example.com",
      student_contact: "9998887776",
      college_id: { _id: collegeId1, college_name: "LDCE" },
      university_id: uniId,
      degree_id: { _id: degreeId1, degree_name: "B.E." },
      branch_id: { branch_name: "Computer" },
      cgpa: 8.9,
      is_deleted: false,
    },
    [studentId2]: {
      _id: studentId2,
      student_name: "Student Two",
      college_id: collegeId1,
      university_id: uniId,
      degree_id: degreeId1,
      is_deleted: false,
    },
  };

  const skillAssocs = [
    {
      _id: skillAssoc1Id,
      student_id: studentId1,
      proficiency: "Advanced",
      is_deleted: false,
      skill_id: { name: "Node.js", is_active: true },
    },
    {
      _id: skillAssoc2Id,
      student_id: studentId2,
      proficiency: "Beginner",
      is_deleted: false,
      skill_id: { name: "Java", is_active: true },
    },
  ];
  const projects = [
    {
      _id: project1Id,
      student_id: studentId1,
      title: "API Gateway {{injected}}",
      description: "Live active project",
      status: "Completed",
      visibility: "Public",
      is_deleted: false,
    },
    {
      _id: projectArchived1Id,
      student_id: studentId1,
      title: "Old Archived Project",
      description: "Should be omitted in live preview",
      status: "Archived",
      visibility: "Public",
      is_deleted: false,
    },
    {
      _id: project2Id,
      student_id: studentId2,
      title: "Student 2 Project",
      description: "Private B",
      status: "Completed",
      visibility: "Private",
      is_deleted: false,
    },
  ];
  const projectLinks = [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      project_id: project1Id,
      link_type: "GITHUB_REPOSITORY",
      url: "https://github.com/prachi/api-gateway",
      label: "GitHub",
      is_deleted: false,
    },
  ];
  const certs = [
    {
      _id: cert1Id,
      student_id: studentId1,
      title: "AWS SAA",
      issuing_organization: "AWS",
      issue_date: new Date("2025-01-01"),
      status: "Active",
      visibility: "Public",
      is_deleted: false,
    },
    {
      _id: cert2Id,
      student_id: studentId2,
      title: "Student2 Cert",
      issuing_organization: "Org",
      issue_date: new Date("2025-01-01"),
      status: "Active",
      visibility: "Private",
      is_deleted: false,
    },
  ];
  const internships = [
    {
      _id: intern1Id,
      student_id: studentId1,
      organization_name: "Tech Creature",
      role_title: "Backend Intern",
      start_date: new Date("2025-02-01"),
      currently_working: true,
      description: "Built scalable services",
      status: "Active",
      visibility: "Public",
      is_deleted: false,
    },
    {
      _id: intern2Id,
      student_id: studentId2,
      organization_name: "Other Co",
      role_title: "Intern",
      start_date: new Date("2025-02-01"),
      currently_working: true,
      status: "Active",
      visibility: "Private",
      is_deleted: false,
    },
  ];
  const histories = [
    {
      _id: edu1Id,
      student_id: studentId1,
      stage_type: "12th",
      institution_name: "State High",
      program_name: "Science",
      score_value: "92",
      score_type: "Percentage",
      is_deleted: false,
    },
    {
      _id: edu2Id,
      student_id: studentId2,
      stage_type: "12th",
      institution_name: "Other High",
      is_deleted: false,
    },
  ];

  const accessService = createAcademicProfileService({
    Student: { findById: (id) => wrapQuery(students[String(id)] || null) },
  });

  const makeModelQuery = (store) => ({
    find: (f) => {
      const ids = (f._id?.$in || []).map(String);
      return wrapQuery(
        store.filter(
          (item) =>
            ids.includes(String(item._id)) &&
            (!f.student_id || String(item.student_id) === String(f.student_id)) &&
            !item.is_deleted,
        ),
      );
    },
  });

  const service = createResumeVersionService({
    accessService,
    Student: { findById: (id) => wrapQuery(students[String(id)] || null) },
    AcademicHistory: makeModelQuery(histories),
    StudentSkill: makeModelQuery(skillAssocs),
    Project: makeModelQuery(projects),
    ProjectLink: {
      find: (f) => {
        const pIds = (f.project_id?.$in || []).map(String);
        return wrapQuery(projectLinks.filter((l) => pIds.includes(String(l.project_id)) && !l.is_deleted));
      },
    },
    Certification: makeModelQuery(certs),
    Internship: makeModelQuery(internships),
    CvTemplate: {
      find: () => wrapQuery([{ _id: templateId, name: "Modern Two Column", html_content: "<h1>{{name}}</h1>{{#projects}}{{title}}{{/projects}}", css_content: "" }]),
      findById: async (id) =>
        String(id) === templateId
          ? { _id: templateId, name: "Modern Two Column", html_content: "<h1>{{name}}</h1>{{#projects}}{{title}}{{/projects}}", css_content: "" }
          : null,
      findOne: async () => ({ _id: templateId, name: "Modern Two Column", html_content: "<h1>{{name}}</h1>{{#projects}}{{title}}{{/projects}}", css_content: "" }),
    },
    ResumeVersion: {
      countDocuments: async (f) =>
        versionsStore.filter((v) => String(v.student_id) === String(f.student_id) && !v.is_deleted).length,
      find: (f) => {
        const list = versionsStore.filter(
          (v) =>
            String(v.student_id) === String(f.student_id) &&
            !v.is_deleted &&
            (!f.visibility?.$ne || v.visibility !== f.visibility.$ne),
        );
        return wrapQuery(list);
      },
      findOne: (f) => {
        const found =
          versionsStore.find((v) => {
            if (v.is_deleted) return false;
            if (f._id && String(v._id) !== String(f._id)) return false;
            if (f.student_id && String(v.student_id) !== String(f.student_id)) return false;
            if (f.share_token && v.share_token !== f.share_token) return false;
            if (f.share_enabled !== undefined && v.share_enabled !== f.share_enabled) return false;
            return true;
          }) || null;
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
            !v.is_deleted &&
            (!f._id?.$ne || String(v._id) !== String(f._id.$ne))
          ) {
            Object.assign(v, update.$set || {});
          }
        }
      },
      create: async (doc) => {
        const item = {
          _id: new mongoose.Types.ObjectId().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...doc,
        };
        versionsStore.push(item);
        return item;
      },
      findByIdAndUpdate: (id, update) => {
        const idx = versionsStore.findIndex((v) => String(v._id) === String(id));
        if (idx === -1) return wrapQuery(null);
        versionsStore[idx] = { ...versionsStore[idx], ...(update.$set || update) };
        return wrapQuery(versionsStore[idx]);
      },
    },
    AuditLog: {
      create: async (doc) => {
        auditLogs.push(doc);
        return doc;
      },
    },
    generatePdf: async (html) => Buffer.from(`%PDF-1.4\n${html.length}`),
  });

  return { service, versionsStore, auditLogs };
};

test("escapeHtmlAndTemplateTokens neutralizes XSS tags and template braces", () => {
  const escaped = escapeHtmlAndTemplateTokens("<script>alert(1)</script>{{name}}");
  assert.ok(!escaped.includes("<script>"));
  assert.ok(!escaped.includes("{{"));
  assert.ok(escaped.includes("&lt;script&gt;"));
  assert.ok(escaped.includes("&#123;&#123;name&#125;&#125;"));
  assert.equal(normalizeSectionConfig([]).length, 6);
});

test("ResumeVersion lifecycle: nested ownership, live stale filtering, duplicate, default, share, and limit", async () => {
  const { service, versionsStore, auditLogs } = makeHarness();

  // Nested resource attacks MUST be rejected across all 5 canonical types
  for (const [field, badId] of [
    ["selected_skill_ids", skillAssoc2Id],
    ["selected_project_ids", project2Id],
    ["selected_certification_ids", cert2Id],
    ["selected_internship_ids", intern2Id],
    ["selected_education_ids", edu2Id],
  ]) {
    await assert.rejects(
      () =>
        service.createResumeVersion({ userId: studentId1, role: "Student" }, studentId1, {
          name: "Bad Nested Resume",
          [field]: [badId],
        }),
      /do not exist or do not belong/i,
    );
  }

  // Create Resume A (auto-default since first)
  const v1 = await service.createResumeVersion({ userId: studentId1, role: "Student" }, studentId1, {
    name: "Backend Resume",
    target_role: "Node.js Developer",
    template_id: templateId,
    selected_skill_ids: [skillAssoc1Id],
    selected_project_ids: [project1Id, projectArchived1Id],
    selected_certification_ids: [cert1Id],
    selected_internship_ids: [intern1Id],
    selected_education_ids: [edu1Id],
  });
  assert.equal(v1.resume_version.is_default, true);

  // Preview composes canonical data, skips Archived project, and escapes HTML/template tokens
  const preview = await service.previewResumeVersion(
    { userId: studentId1, role: "Student" },
    studentId1,
    v1.resume_version.id,
  );
  assert.equal(preview.composed_content.projects.length, 1);
  assert.equal(preview.composed_content.skills[0].display_label, "Node.js (Advanced)");
  assert.ok(!preview.compiled_html.includes("<script>"));
  assert.ok(preview.compiled_html.includes("&lt;script&gt;"));

  // Duplicate copies configuration references without copying entities & clears is_default
  const dup = await service.duplicateResumeVersion(
    { userId: studentId1, role: "Student" },
    studentId1,
    v1.resume_version.id,
    { name: "Backend Resume - Placement" },
  );
  assert.equal(dup.resume_version.is_default, false);
  assert.deepEqual(dup.resume_version.selected_project_ids, [project1Id, projectArchived1Id]);

  // Setting dup as default clears v1 default (single default invariant)
  await service.setDefaultResumeVersion(
    { userId: studentId1, role: "Student" },
    studentId1,
    dup.resume_version.id,
  );
  assert.equal(versionsStore.find((v) => String(v._id) === String(v1.resume_version.id)).is_default, false);
  assert.equal(versionsStore.find((v) => String(v._id) === String(dup.resume_version.id)).is_default, true);

  // Share enable -> accessible via token (contact masked) -> revoke -> denied
  const shared = await service.updateResumeShare(
    { userId: studentId1, role: "Student" },
    studentId1,
    dup.resume_version.id,
    { share_enabled: true, expires_in_days: 7 },
  );
  const token = shared.resume_version.share_token;
  assert.ok(token && token.length >= 32);

  const anonRes = await service.getSharedResumeByToken(token);
  assert.equal(anonRes.composed_content.header.contact, "");

  await service.updateResumeShare(
    { userId: studentId1, role: "Student" },
    studentId1,
    dup.resume_version.id,
    { share_enabled: false },
  );
  await assert.rejects(() => service.getSharedResumeByToken(token), /revoked/i);

  // Generate PDF logs audit & returns buffer
  const pdfRes = await service.generateResumePdf(
    { userId: studentId1, role: "Student" },
    studentId1,
    dup.resume_version.id,
  );
  assert.ok(pdfRes.pdfBuffer.toString("ascii").startsWith("%PDF-"));
  assert.ok(auditLogs.some((a) => a.action === "GENERATE_RESUME_PDF"));

  // Enforces MAX_RESUME_VERSIONS_PER_STUDENT
  for (let i = versionsStore.length; i < MAX_RESUME_VERSIONS_PER_STUDENT; i++) {
    await service.createResumeVersion({ userId: studentId1, role: "Student" }, studentId1, {
      name: `Resume #${i + 1}`,
    });
  }
  await assert.rejects(
    () =>
      service.createResumeVersion({ userId: studentId1, role: "Student" }, studentId1, {
        name: "Overflow Resume",
      }),
    /Maximum limit/i,
  );
});
