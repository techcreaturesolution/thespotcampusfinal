import crypto from "crypto";
import mongoose from "mongoose";
import tbl_resume_version from "./resumeVersion.model.js";
import tbl_student from "../student/student.model.js";
import tbl_academic_history from "../academicProfile/academicHistory.model.js";
import tbl_student_skill from "../skills/studentSkill.model.js";
import tbl_project from "../projects/project.model.js";
import tbl_project_link from "../projects/projectLink.model.js";
import tbl_certification from "../certifications/certification.model.js";
import tbl_internship from "../internships/internship.model.js";
import tbl_cv_template from "../student/cvTemplate.model.js";
import tbl_document from "../documents/document.model.js";
import tbl_audit_log from "../audit/auditLog.model.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { academicProfileService } from "../academicProfile/academicProfile.service.js";
import { sanitizePlainText } from "../projects/projects.service.js";
import { compileHtmlTemplate } from "../student/cvTemplate.controller.js";
import { BUILTIN_LAYOUTS } from "../../utils/cvTemplates.js";
import { generatePdfFromHtml } from "../../utils/pdfGenerator.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/customErrors.js";
import {
  CERTIFICATION_STATUS,
  CERTIFICATION_VISIBILITY,
  INTERNSHIP_STATUS,
  INTERNSHIP_VISIBILITY,
  MAX_RESUME_VERSIONS_PER_STUDENT,
  PROJECT_STATUS,
  PROJECT_VISIBILITY,
  RESUME_FONT_FAMILIES,
  RESUME_LAYOUT_COLUMNS,
  RESUME_PAGE_MARGINS,
  RESUME_SECTION_KEYS,
  RESUME_VERSION_STATUS,
  RESUME_VERSION_VISIBILITY,
} from "../../utils/constants.js";

const PROTECTED_PAYLOAD_FIELDS = [
  "student_id",
  "institute_id",
  "college_id",
  "university_id",
  "is_verified",
  "verification_status",
  "created_by",
  "share_token",
  "last_generated_at",
  "generated_file_path",
  "is_deleted",
  "deleted_at",
  "deleted_by_id",
  "deleted_by_role",
];

// Escape HTML & Mustache braces so user-controlled values can never execute scripts or template syntax
export const escapeHtmlAndTemplateTokens = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");
};

export const normalizeSectionConfig = (rawSections) => {
  const defaultConfig = RESUME_SECTION_KEYS.map((key, idx) => ({
    section_key: key,
    enabled: true,
    order: idx,
  }));
  if (!Array.isArray(rawSections) || rawSections.length === 0) {
    return defaultConfig;
  }

  const byKey = new Map();
  for (const item of rawSections) {
    if (!item || !RESUME_SECTION_KEYS.includes(item.section_key)) continue;
    byKey.set(item.section_key, {
      section_key: item.section_key,
      enabled: item.enabled !== undefined ? Boolean(item.enabled) : true,
      order: Number.isInteger(Number(item.order)) ? Number(item.order) : byKey.size,
    });
  }

  let nextOrder = byKey.size;
  for (const key of RESUME_SECTION_KEYS) {
    if (!byKey.has(key)) {
      byKey.set(key, { section_key: key, enabled: true, order: nextOrder++ });
    }
  }

  return [...byKey.values()]
    .sort((a, b) => a.order - b.order)
    .map((entry, idx) => ({ ...entry, order: idx }));
};

const orderDocsByReferenceList = (orderedIds = [], docs = []) => {
  const map = new Map(docs.map((d) => [String(d._id), d]));
  const ordered = [];
  for (const rawId of orderedIds) {
    const doc = map.get(String(rawId));
    if (doc) ordered.push(doc);
  }
  return ordered;
};

const formatMonthYear = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 7);
};

const formatVersionMetadata = (doc) => ({
  id: doc._id,
  student_id: doc.student_id,
  name: doc.name,
  description: doc.description || "",
  target_role: doc.target_role || "",
  summary: doc.summary || "",
  template_id: doc.template_id?._id || doc.template_id || null,
  template_name: doc.template_id?.name || "",
  font_family: doc.font_family || "Inter",
  color_theme: doc.color_theme || "#3730a3",
  layout_columns: doc.layout_columns || "two_column_left",
  page_margin: doc.page_margin || "medium",
  section_config: normalizeSectionConfig(doc.section_config),
  selected_skill_ids: (doc.selected_skill_ids || []).map(String),
  selected_project_ids: (doc.selected_project_ids || []).map(String),
  selected_certification_ids: (doc.selected_certification_ids || []).map(String),
  selected_internship_ids: (doc.selected_internship_ids || []).map(String),
  selected_education_ids: (doc.selected_education_ids || []).map(String),
  uploaded_document_id: doc.uploaded_document_id ? String(doc.uploaded_document_id) : null,
  include_academic_summary: doc.include_academic_summary !== false,
  include_skill_proficiency: doc.include_skill_proficiency !== false,
  include_project_links: doc.include_project_links !== false,
  status: doc.status || RESUME_VERSION_STATUS.ACTIVE,
  visibility: doc.visibility || RESUME_VERSION_VISIBILITY.PRIVATE,
  is_default: Boolean(doc.is_default),
  display_order: doc.display_order ?? 0,
  share_enabled: Boolean(doc.share_enabled),
  share_token: doc.share_enabled ? doc.share_token : null,
  share_expires_at: doc.share_expires_at || null,
  last_generated_at: doc.last_generated_at || null,
  created_at: doc.createdAt || null,
  updated_at: doc.updatedAt || null,
});

export const createResumeVersionService = (deps = {}) => {
  const ResumeVersion = deps.ResumeVersion || tbl_resume_version;
  const Student = deps.Student || tbl_student;
  const AcademicHistory = deps.AcademicHistory || tbl_academic_history;
  const StudentSkill = deps.StudentSkill || tbl_student_skill;
  const Project = deps.Project || tbl_project;
  const ProjectLink = deps.ProjectLink || tbl_project_link;
  const Certification = deps.Certification || tbl_certification;
  const Internship = deps.Internship || tbl_internship;
  const CvTemplate = deps.CvTemplate || tbl_cv_template;
  const Document = deps.Document || tbl_document;
  const AuditLog = deps.AuditLog || tbl_audit_log;
  const accessService = deps.accessService || academicProfileService;
  const isValidObjectId = deps.isValidObjectId || mongoose.isValidObjectId;
  const compileHtml = deps.compileHtml || compileHtmlTemplate;
  const generatePdf = deps.generatePdf || generatePdfFromHtml;

  const assertValidId = (id, label = "ID") => {
    if (!id || !isValidObjectId(id)) {
      throw new BadRequestError(`Invalid ${label} format`);
    }
  };

  const assertWritablePayloadSafe = (payload) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestError("Request body must be a JSON object");
    }
    for (const key of PROTECTED_PAYLOAD_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        throw new UnauthorizedError(`Field '${key}' cannot be supplied by client`);
      }
    }
  };

  const loadTargetStudent = async (studentId) => {
    assertValidId(studentId, "student ID");
    const student = await Student.findById(studentId)
      .populate("branch_id", "branch_name")
      .populate("degree_id", "degree_name")
      .populate("college_id", "college_name");
    if (!student || student.is_deleted) {
      throw new NotFoundError(`No student found with id: ${studentId}`);
    }
    return student;
  };

  const validateOwnedIds = async (Model, studentId, ids = [], label = "record") => {
    if (!Array.isArray(ids)) {
      throw new BadRequestError(`selected ${label} IDs must be an array`);
    }
    const unique = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
    if (unique.length === 0) return [];
    for (const id of unique) {
      assertValidId(id, `${label} ID`);
    }
    const found = await Model.find({
      _id: { $in: unique },
      student_id: studentId,
      is_deleted: false,
    });
    if (found.length !== unique.length) {
      throw new BadRequestError(
        `One or more selected ${label} records do not exist or do not belong to this student`,
      );
    }
    return unique;
  };

  const validateTemplateId = async (templateId) => {
    if (!templateId) return null;
    assertValidId(templateId, "template ID");
    const tpl = await CvTemplate.findById(templateId);
    if (!tpl) {
      throw new BadRequestError("Selected CV template does not exist");
    }
    return tpl._id;
  };

  const validateUploadedDocumentId = async (studentId, docId) => {
    if (!docId) return null;
    assertValidId(docId, "document ID");
    const doc = await Document.findOne({
      _id: docId,
      owner_id: studentId,
      document_type: "RESUME",
      is_deleted: false,
    });
    if (!doc) {
      throw new BadRequestError(
        "Selected uploaded resume document does not exist or does not belong to this student",
      );
    }
    return doc._id;
  };

  const validateAndVerifySelections = async (studentId, payload) => {
    const [
      template_id,
      uploaded_document_id,
      selected_skill_ids,
      selected_project_ids,
      selected_certification_ids,
      selected_internship_ids,
      selected_education_ids,
    ] = await Promise.all([
      payload.template_id !== undefined ? validateTemplateId(payload.template_id) : undefined,
      payload.uploaded_document_id !== undefined
        ? validateUploadedDocumentId(studentId, payload.uploaded_document_id)
        : undefined,
      payload.selected_skill_ids !== undefined
        ? validateOwnedIds(StudentSkill, studentId, payload.selected_skill_ids, "skill")
        : undefined,
      payload.selected_project_ids !== undefined
        ? validateOwnedIds(Project, studentId, payload.selected_project_ids, "project")
        : undefined,
      payload.selected_certification_ids !== undefined
        ? validateOwnedIds(
            Certification,
            studentId,
            payload.selected_certification_ids,
            "certification",
          )
        : undefined,
      payload.selected_internship_ids !== undefined
        ? validateOwnedIds(Internship, studentId, payload.selected_internship_ids, "internship")
        : undefined,
      payload.selected_education_ids !== undefined
        ? validateOwnedIds(
            AcademicHistory,
            studentId,
            payload.selected_education_ids,
            "education",
          )
        : undefined,
    ]);

    return {
      template_id,
      uploaded_document_id,
      selected_skill_ids,
      selected_project_ids,
      selected_certification_ids,
      selected_internship_ids,
      selected_education_ids,
    };
  };

  const assertVisibleToActor = (scopedActor, studentId, version) => {
    if (scopedActor.role === "Admin" || String(scopedActor.userId) === String(studentId)) {
      return true;
    }
    return version.visibility !== RESUME_VERSION_VISIBILITY.PRIVATE;
  };

  const composeCanonicalResumeData = async (
    versionDoc,
    student,
    { isOwnerOrAdmin = true, maskPrivateContact = false } = {},
  ) => {
    const skillIds = (versionDoc.selected_skill_ids || []).map(String);
    const projectIds = (versionDoc.selected_project_ids || []).map(String);
    const certIds = (versionDoc.selected_certification_ids || []).map(String);
    const internshipIds = (versionDoc.selected_internship_ids || []).map(String);
    const eduIds = (versionDoc.selected_education_ids || []).map(String);

    const [skillsRaw, projectsRaw, projectLinksRaw, certsRaw, internshipsRaw, eduRaw] =
      await Promise.all([
        skillIds.length
          ? StudentSkill.find({
              _id: { $in: skillIds },
              student_id: student._id,
              is_deleted: false,
            }).populate("skill_id", "name category is_active")
          : Promise.resolve([]),
        projectIds.length
          ? Project.find({
              _id: { $in: projectIds },
              student_id: student._id,
              is_deleted: false,
            })
          : Promise.resolve([]),
        projectIds.length && versionDoc.include_project_links !== false
          ? ProjectLink.find({
              project_id: { $in: projectIds },
              is_deleted: false,
            }).sort({ display_order: 1 })
          : Promise.resolve([]),
        certIds.length
          ? Certification.find({
              _id: { $in: certIds },
              student_id: student._id,
              is_deleted: false,
            })
          : Promise.resolve([]),
        internshipIds.length
          ? Internship.find({
              _id: { $in: internshipIds },
              student_id: student._id,
              is_deleted: false,
            })
          : Promise.resolve([]),
        eduIds.length
          ? AcademicHistory.find({
              _id: { $in: eduIds },
              student_id: student._id,
              is_deleted: false,
            })
          : Promise.resolve([]),
      ]);

    const sectionCfg = normalizeSectionConfig(versionDoc.section_config);
    const isEnabled = (key) => sectionCfg.find((s) => s.section_key === key)?.enabled !== false;

    const linksByProject = new Map();
    for (const l of projectLinksRaw) {
      const k = String(l.project_id);
      if (!linksByProject.has(k)) linksByProject.set(k, []);
      linksByProject.get(k).push(l);
    }

    // Order strictly by configuration array & enforce stale/archived/private filtering
    const orderedSkills = isEnabled("skills")
      ? orderDocsByReferenceList(skillIds, skillsRaw).filter(
          (s) => s.skill_id && s.skill_id.is_active !== false,
        )
      : [];
    const orderedProjects = isEnabled("projects")
      ? orderDocsByReferenceList(projectIds, projectsRaw).filter(
          (p) =>
            p.status !== PROJECT_STATUS.ARCHIVED &&
            (isOwnerOrAdmin || p.visibility !== PROJECT_VISIBILITY.PRIVATE),
        )
      : [];
    const orderedCerts = isEnabled("certifications")
      ? orderDocsByReferenceList(certIds, certsRaw).filter(
          (c) =>
            c.status !== CERTIFICATION_STATUS.ARCHIVED &&
            (isOwnerOrAdmin || c.visibility !== CERTIFICATION_VISIBILITY.PRIVATE),
        )
      : [];
    const orderedInternships = isEnabled("internships")
      ? orderDocsByReferenceList(internshipIds, internshipsRaw).filter(
          (i) =>
            i.status !== INTERNSHIP_STATUS.ARCHIVED &&
            (isOwnerOrAdmin || i.visibility !== INTERNSHIP_VISIBILITY.PRIVATE),
        )
      : [];
    const orderedEdu = isEnabled("education")
      ? orderDocsByReferenceList(eduIds, eduRaw)
      : [];

    const composedSkills = orderedSkills.map((assoc) => {
      const name = assoc.skill_id?.name || "";
      const prof = assoc.proficiency || "";
      const displayLabel =
        versionDoc.include_skill_proficiency !== false && prof ? `${name} (${prof})` : name;
      return {
        id: assoc._id,
        name,
        proficiency: prof,
        display_label: displayLabel,
      };
    });

    const composedProjects = orderedProjects.map((proj) => {
      const projLinks = (linksByProject.get(String(proj._id)) || []).map((l) => ({
        link_type: l.link_type,
        url: l.url,
        label: l.label,
      }));
      const primaryUrl = projLinks[0]?.url || proj.repository_url || proj.live_demo_url || proj.project_url || "";
      return {
        id: proj._id,
        title: proj.title,
        description: proj.description,
        link: versionDoc.include_project_links !== false ? primaryUrl : "",
        links: versionDoc.include_project_links !== false ? projLinks : [],
      };
    });

    const composedCerts = orderedCerts.map((cert) => {
      const dateTxt = formatMonthYear(cert.issue_date);
      const label = `${cert.title} — ${cert.issuing_organization}${dateTxt ? ` (${dateTxt})` : ""}`;
      return {
        id: cert._id,
        title: cert.title,
        issuing_organization: cert.issuing_organization,
        credential_url: cert.credential_url || "",
        issue_date: cert.issue_date || null,
        display_label: label,
      };
    });

    const composedInternships = orderedInternships.map((exp) => ({
      id: exp._id,
      company: exp.organization_name,
      role: exp.role_title,
      location: exp.location || "",
      work_mode: exp.work_mode || "",
      startDate: formatMonthYear(exp.start_date),
      endDate: exp.currently_working ? "Present" : formatMonthYear(exp.end_date),
      currently_working: Boolean(exp.currently_working),
      description: exp.description || exp.responsibilities || exp.achievements || "",
    }));

    const composedEducation = orderedEdu.map((ed) => ({
      id: ed._id,
      institution: ed.institution_name,
      degree: ed.program_name || ed.stage_type,
      fieldOfStudy: ed.department_name || "",
      startYear: ed.start_year ? String(ed.start_year) : "",
      endYear: ed.end_year ? String(ed.end_year) : "",
      score: ed.score_value ? `${ed.score_value} ${ed.score_type || ""}`.trim() : "",
    }));

    if (
      isEnabled("education") &&
      versionDoc.include_academic_summary !== false &&
      (student.degree_id || student.college_id || student.cgpa || student.percentage)
    ) {
      composedEducation.unshift({
        id: "academic_primary",
        institution: student.college_id?.college_name || "Current Institute",
        degree: student.degree_id?.degree_name || "Current Program",
        fieldOfStudy: student.branch_id?.branch_name || "",
        startYear: student.admission_year ? String(student.admission_year) : "",
        endYear: student.expected_graduation_year
          ? String(student.expected_graduation_year)
          : "",
        score:
          student.cgpa !== null && student.cgpa !== undefined
            ? `${student.cgpa} CGPA`
            : student.percentage !== null && student.percentage !== undefined
              ? `${student.percentage}%`
              : "",
      });
    }

    // Build XSS-safe & template-injection-safe object for HTML/PDF template compilation
    const safeRenderData = {
      punch_line: escapeHtmlAndTemplateTokens(versionDoc.target_role || ""),
      chosen_summary: isEnabled("summary")
        ? escapeHtmlAndTemplateTokens(versionDoc.summary || "")
        : "",
      font_family: versionDoc.font_family || "Inter",
      color_theme: versionDoc.color_theme || "#3730a3",
      page_margin: versionDoc.page_margin || "medium",
      layout_columns: versionDoc.layout_columns || "two_column_left",
      skills: composedSkills.map((s) => escapeHtmlAndTemplateTokens(s.display_label)),
      projects: composedProjects.map((p) => ({
        title: escapeHtmlAndTemplateTokens(p.title),
        description: escapeHtmlAndTemplateTokens(p.description),
        link: escapeHtmlAndTemplateTokens(p.link),
        technologies: [],
      })),
      certifications: composedCerts.map((c) => escapeHtmlAndTemplateTokens(c.display_label)),
      experience: composedInternships.map((i) => ({
        company: escapeHtmlAndTemplateTokens(i.company),
        role: escapeHtmlAndTemplateTokens(i.role),
        startDate: escapeHtmlAndTemplateTokens(i.startDate),
        endDate: escapeHtmlAndTemplateTokens(i.endDate),
        description: escapeHtmlAndTemplateTokens(i.description),
      })),
      education: composedEducation.map((e) => ({
        institution: escapeHtmlAndTemplateTokens(e.institution),
        degree: escapeHtmlAndTemplateTokens(e.degree),
        fieldOfStudy: escapeHtmlAndTemplateTokens(e.fieldOfStudy),
        startYear: escapeHtmlAndTemplateTokens(e.startYear),
        endYear: escapeHtmlAndTemplateTokens(e.endYear),
        score: escapeHtmlAndTemplateTokens(e.score),
      })),
      languages: [],
    };

    const safeStudentForRender = {
      student_name: escapeHtmlAndTemplateTokens(student.student_name || ""),
      student_email: maskPrivateContact
        ? ""
        : escapeHtmlAndTemplateTokens(student.student_email || ""),
      student_contact: maskPrivateContact
        ? ""
        : escapeHtmlAndTemplateTokens(student.student_contact || ""),
      degree_id: {
        degree_name: escapeHtmlAndTemplateTokens(student.degree_id?.degree_name || ""),
      },
      branch_id: {
        branch_name: escapeHtmlAndTemplateTokens(student.branch_id?.branch_name || ""),
      },
      college_id: {
        college_name: escapeHtmlAndTemplateTokens(student.college_id?.college_name || ""),
      },
    };

    return {
      section_config: sectionCfg,
      composed: {
        header: {
          name: student.student_name || "",
          email: maskPrivateContact ? "" : student.student_email || "",
          contact: maskPrivateContact ? "" : student.student_contact || "",
          target_role: versionDoc.target_role || "",
        },
        summary: isEnabled("summary") ? versionDoc.summary || "" : "",
        skills: composedSkills,
        projects: composedProjects,
        internships: composedInternships,
        certifications: composedCerts,
        education: composedEducation,
      },
      safeRenderData,
      safeStudentForRender,
    };
  };

  const resolveTemplateLayout = async (templateId) => {
    let tpl = null;
    if (templateId) {
      tpl = await CvTemplate.findById(templateId);
    }
    if (!tpl) {
      tpl = await CvTemplate.findOne({});
    }
    if (tpl && tpl.html_content) {
      return {
        html: tpl.html_content,
        css: tpl.css_content || "",
        template_name: tpl.name || "Template",
      };
    }
    const fallback = BUILTIN_LAYOUTS?.cv1 || {
      html: "<div><h1>{{name}}</h1><p>{{summary}}</p></div>",
      css: "",
    };
    return { html: fallback.html, css: fallback.css, template_name: "Classic Fallback" };
  };

  const getMetadata = async () => {
    const templates = await CvTemplate.find({}).select("name thumbnail").sort("-createdAt");
    return {
      statuses: Object.values(RESUME_VERSION_STATUS),
      visibilities: Object.values(RESUME_VERSION_VISIBILITY),
      sections: RESUME_SECTION_KEYS,
      font_families: RESUME_FONT_FAMILIES,
      layout_columns: RESUME_LAYOUT_COLUMNS,
      page_margins: RESUME_PAGE_MARGINS,
      max_versions: MAX_RESUME_VERSIONS_PER_STUDENT,
      templates: templates.map((t) => ({ id: t._id, name: t.name, thumbnail: t.thumbnail || "" })),
    };
  };

  const listStudentResumeVersions = async (
    actor,
    targetStudentId,
    { status = "", search = "" } = {},
  ) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");

    const filter = { student_id: student._id, is_deleted: false };
    if (status) {
      if (!Object.values(RESUME_VERSION_STATUS).includes(status)) {
        throw new BadRequestError("Invalid status filter");
      }
      filter.status = status;
    }

    const cleanSearch = sanitizePlainText(search).slice(0, 100);
    if (cleanSearch) {
      const rx = new RegExp(cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { target_role: rx }, { description: rx }];
    }

    const isOwnerOrAdmin =
      scopedActor.role === "Admin" || String(scopedActor.userId) === String(student._id);
    if (!isOwnerOrAdmin) {
      filter.visibility = { $ne: RESUME_VERSION_VISIBILITY.PRIVATE };
    }

    const docs = await ResumeVersion.find(filter)
      .populate("template_id", "name")
      .sort({ is_default: -1, display_order: 1, updatedAt: -1 });

    const visibleDocs = docs.filter((d) => assertVisibleToActor(scopedActor, student._id, d));
    const meta = await getMetadata();

    return {
      student_id: student._id,
      resume_versions: visibleDocs.map(formatVersionMetadata),
      ...meta,
    };
  };

  const getResumeVersionById = async (actor, targetStudentId, resumeId) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");
    assertValidId(resumeId, "resume version ID");

    const doc = await ResumeVersion.findOne({
      _id: resumeId,
      student_id: student._id,
      is_deleted: false,
    }).populate("template_id", "name");
    if (!doc) {
      throw new NotFoundError("Resume version not found");
    }
    if (!assertVisibleToActor(scopedActor, student._id, doc)) {
      throw new UnauthorizedError("This resume version is private");
    }

    const isOwnerOrAdmin =
      scopedActor.role === "Admin" || String(scopedActor.userId) === String(student._id);
    const composed = await composeCanonicalResumeData(doc, student, { isOwnerOrAdmin });

    return {
      resume_version: formatVersionMetadata(doc),
      composed_content: composed.composed,
    };
  };

  const createResumeVersion = async (actor, targetStudentId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertWritablePayloadSafe(payload);

    const activeCount = await ResumeVersion.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });
    if (activeCount >= MAX_RESUME_VERSIONS_PER_STUDENT) {
      throw new BadRequestError(
        `Maximum limit of ${MAX_RESUME_VERSIONS_PER_STUDENT} resume versions reached`,
      );
    }

    const name = sanitizePlainText(payload.name);
    if (name.length < 2 || name.length > 120) {
      throw new BadRequestError("Resume name must be between 2 and 120 characters");
    }

    const refs = await validateAndVerifySelections(student._id, payload);
    const wantsDefault = payload.is_default !== undefined ? Boolean(payload.is_default) : activeCount === 0;

    if (wantsDefault) {
      await ResumeVersion.updateMany(
        { student_id: student._id, is_deleted: false, is_default: true },
        { $set: { is_default: false } },
      );
    }

    const created = await ResumeVersion.create({
      student_id: student._id,
      name,
      normalized_name: name.toLowerCase(),
      description: sanitizePlainText(payload.description).slice(0, 500),
      target_role: sanitizePlainText(payload.target_role).slice(0, 120),
      summary: sanitizePlainText(payload.summary).slice(0, 2000),
      template_id: refs.template_id ?? null,
      font_family: RESUME_FONT_FAMILIES.includes(payload.font_family)
        ? payload.font_family
        : "Inter",
      color_theme:
        payload.color_theme && /^#[0-9a-fA-F]{6}$/.test(payload.color_theme)
          ? payload.color_theme
          : "#3730a3",
      layout_columns: RESUME_LAYOUT_COLUMNS.includes(payload.layout_columns)
        ? payload.layout_columns
        : "two_column_left",
      page_margin: RESUME_PAGE_MARGINS.includes(payload.page_margin)
        ? payload.page_margin
        : "medium",
      section_config: normalizeSectionConfig(payload.section_config),
      selected_skill_ids: refs.selected_skill_ids ?? [],
      selected_project_ids: refs.selected_project_ids ?? [],
      selected_certification_ids: refs.selected_certification_ids ?? [],
      selected_internship_ids: refs.selected_internship_ids ?? [],
      selected_education_ids: refs.selected_education_ids ?? [],
      uploaded_document_id: refs.uploaded_document_id ?? null,
      include_academic_summary: payload.include_academic_summary !== false,
      include_skill_proficiency: payload.include_skill_proficiency !== false,
      include_project_links: payload.include_project_links !== false,
      status: Object.values(RESUME_VERSION_STATUS).includes(payload.status)
        ? payload.status
        : RESUME_VERSION_STATUS.ACTIVE,
      visibility: Object.values(RESUME_VERSION_VISIBILITY).includes(payload.visibility)
        ? payload.visibility
        : RESUME_VERSION_VISIBILITY.PRIVATE,
      is_default: wantsDefault,
      display_order: activeCount,
      is_deleted: false,
    });

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_resume_version",
        targetId: created._id,
        action: "CREATE_RESUME_VERSION",
        changedFields: Object.keys(payload),
        previousValues: {},
        newValues: { name, is_default: wantsDefault, visibility: created.visibility },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return {
      msg: "Resume version created",
      resume_version: formatVersionMetadata(created),
    };
  };

  const updateResumeVersion = async (actor, targetStudentId, resumeId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(resumeId, "resume version ID");
    assertWritablePayloadSafe(payload);

    const existing = await ResumeVersion.findOne({
      _id: resumeId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Resume version not found");
    }

    const refs = await validateAndVerifySelections(student._id, payload);
    const prevSnap = {
      name: existing.name,
      template_id: existing.template_id,
      visibility: existing.visibility,
      is_default: existing.is_default,
    };

    if (payload.name !== undefined) {
      const nextName = sanitizePlainText(payload.name);
      if (nextName.length < 2 || nextName.length > 120) {
        throw new BadRequestError("Resume name must be between 2 and 120 characters");
      }
      existing.name = nextName;
      existing.normalized_name = nextName.toLowerCase();
    }
    if (payload.description !== undefined) {
      existing.description = sanitizePlainText(payload.description).slice(0, 500);
    }
    if (payload.target_role !== undefined) {
      existing.target_role = sanitizePlainText(payload.target_role).slice(0, 120);
    }
    if (payload.summary !== undefined) {
      existing.summary = sanitizePlainText(payload.summary).slice(0, 2000);
    }
    if (payload.template_id !== undefined) {
      existing.template_id = refs.template_id ?? null;
    }
    if (payload.font_family !== undefined) {
      if (!RESUME_FONT_FAMILIES.includes(payload.font_family)) {
        throw new BadRequestError("Invalid font_family");
      }
      existing.font_family = payload.font_family;
    }
    if (payload.color_theme !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(payload.color_theme)) {
        throw new BadRequestError("Invalid color_theme hex code");
      }
      existing.color_theme = payload.color_theme;
    }
    if (payload.layout_columns !== undefined) {
      if (!RESUME_LAYOUT_COLUMNS.includes(payload.layout_columns)) {
        throw new BadRequestError("Invalid layout_columns");
      }
      existing.layout_columns = payload.layout_columns;
    }
    if (payload.page_margin !== undefined) {
      if (!RESUME_PAGE_MARGINS.includes(payload.page_margin)) {
        throw new BadRequestError("Invalid page_margin");
      }
      existing.page_margin = payload.page_margin;
    }
    if (payload.section_config !== undefined) {
      existing.section_config = normalizeSectionConfig(payload.section_config);
    }
    if (refs.selected_skill_ids !== undefined) existing.selected_skill_ids = refs.selected_skill_ids;
    if (refs.selected_project_ids !== undefined) existing.selected_project_ids = refs.selected_project_ids;
    if (refs.selected_certification_ids !== undefined)
      existing.selected_certification_ids = refs.selected_certification_ids;
    if (refs.selected_internship_ids !== undefined)
      existing.selected_internship_ids = refs.selected_internship_ids;
    if (refs.selected_education_ids !== undefined)
      existing.selected_education_ids = refs.selected_education_ids;
    if (refs.uploaded_document_id !== undefined)
      existing.uploaded_document_id = refs.uploaded_document_id;

    if (payload.include_academic_summary !== undefined) {
      existing.include_academic_summary = Boolean(payload.include_academic_summary);
    }
    if (payload.include_skill_proficiency !== undefined) {
      existing.include_skill_proficiency = Boolean(payload.include_skill_proficiency);
    }
    if (payload.include_project_links !== undefined) {
      existing.include_project_links = Boolean(payload.include_project_links);
    }
    if (payload.status !== undefined) {
      if (!Object.values(RESUME_VERSION_STATUS).includes(payload.status)) {
        throw new BadRequestError("Invalid status");
      }
      existing.status = payload.status;
    }
    if (payload.visibility !== undefined) {
      if (!Object.values(RESUME_VERSION_VISIBILITY).includes(payload.visibility)) {
        throw new BadRequestError("Invalid visibility");
      }
      existing.visibility = payload.visibility;
    }
    if (payload.is_default === true && !existing.is_default) {
      await ResumeVersion.updateMany(
        { student_id: student._id, is_deleted: false, _id: { $ne: existing._id } },
        { $set: { is_default: false } },
      );
      existing.is_default = true;
    } else if (payload.is_default === false) {
      existing.is_default = false;
    }

    await existing.save();

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_resume_version",
        targetId: existing._id,
        action: "UPDATE_RESUME_VERSION",
        changedFields: Object.keys(payload),
        previousValues: prevSnap,
        newValues: {
          name: existing.name,
          visibility: existing.visibility,
          is_default: existing.is_default,
        },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return {
      msg: "Resume version updated",
      resume_version: formatVersionMetadata(existing),
    };
  };

  const duplicateResumeVersion = async (actor, targetStudentId, resumeId, payload = {}, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(resumeId, "resume version ID");

    const source = await ResumeVersion.findOne({
      _id: resumeId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!source) {
      throw new NotFoundError("Source resume version not found");
    }

    const activeCount = await ResumeVersion.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });
    if (activeCount >= MAX_RESUME_VERSIONS_PER_STUDENT) {
      throw new BadRequestError(
        `Maximum limit of ${MAX_RESUME_VERSIONS_PER_STUDENT} resume versions reached`,
      );
    }

    const rawCopyName = payload?.name ? sanitizePlainText(payload.name) : `Copy of ${source.name}`;
    const copyName = rawCopyName.slice(0, 120);
    if (copyName.length < 2) {
      throw new BadRequestError("Resume name must be between 2 and 120 characters");
    }

    // Re-filter canonical reference IDs so deleted source references are safely excluded
    const filterExisting = async (Model, ids) => {
      if (!ids?.length) return [];
      const found = await Model.find({
        _id: { $in: ids },
        student_id: student._id,
        is_deleted: false,
      });
      return orderDocsByReferenceList(ids, found).map((d) => d._id);
    };

    const [skillIds, projectIds, certIds, internshipIds, eduIds] = await Promise.all([
      filterExisting(StudentSkill, source.selected_skill_ids),
      filterExisting(Project, source.selected_project_ids),
      filterExisting(Certification, source.selected_certification_ids),
      filterExisting(Internship, source.selected_internship_ids),
      filterExisting(AcademicHistory, source.selected_education_ids),
    ]);

    const cloned = await ResumeVersion.create({
      student_id: student._id,
      name: copyName,
      normalized_name: copyName.toLowerCase(),
      description: source.description || "",
      target_role: source.target_role || "",
      summary: source.summary || "",
      template_id: source.template_id || null,
      font_family: source.font_family || "Inter",
      color_theme: source.color_theme || "#3730a3",
      layout_columns: source.layout_columns || "two_column_left",
      page_margin: source.page_margin || "medium",
      section_config: normalizeSectionConfig(source.section_config),
      selected_skill_ids: skillIds,
      selected_project_ids: projectIds,
      selected_certification_ids: certIds,
      selected_internship_ids: internshipIds,
      selected_education_ids: eduIds,
      include_academic_summary: source.include_academic_summary !== false,
      include_skill_proficiency: source.include_skill_proficiency !== false,
      include_project_links: source.include_project_links !== false,
      status: RESUME_VERSION_STATUS.ACTIVE,
      visibility: source.visibility || RESUME_VERSION_VISIBILITY.PRIVATE,
      is_default: false,
      display_order: activeCount,
      is_deleted: false,
    });

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_resume_version",
        targetId: cloned._id,
        action: "DUPLICATE_RESUME_VERSION",
        changedFields: ["cloned_from"],
        previousValues: { source_id: source._id, source_name: source.name },
        newValues: { id: cloned._id, name: copyName },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return {
      msg: "Resume version duplicated",
      resume_version: formatVersionMetadata(cloned),
    };
  };

  const setDefaultResumeVersion = async (actor, targetStudentId, resumeId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(resumeId, "resume version ID");

    const target = await ResumeVersion.findOne({
      _id: resumeId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!target) {
      throw new NotFoundError("Resume version not found");
    }

    await ResumeVersion.updateMany(
      { student_id: student._id, is_deleted: false, _id: { $ne: target._id } },
      { $set: { is_default: false } },
    );

    target.is_default = true;
    await target.save();

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_resume_version",
        targetId: target._id,
        action: "SET_DEFAULT_RESUME_VERSION",
        changedFields: ["is_default"],
        previousValues: {},
        newValues: { name: target.name, is_default: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return {
      msg: "Default resume version updated",
      resume_version: formatVersionMetadata(target),
    };
  };

  const deleteResumeVersion = async (actor, targetStudentId, resumeId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(resumeId, "resume version ID");

    const existing = await ResumeVersion.findOne({
      _id: resumeId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Resume version not found");
    }

    const wasDefault = Boolean(existing.is_default);
    existing.is_deleted = true;
    existing.is_default = false;
    existing.share_enabled = false;
    existing.share_token = null;
    existing.deleted_at = new Date();
    existing.deleted_by_id = scopedActor.userId;
    existing.deleted_by_role = scopedActor.role;
    await existing.save();

    if (wasDefault) {
      const nextFallback = await ResumeVersion.findOne({
        student_id: student._id,
        is_deleted: false,
      });
      if (nextFallback) {
        nextFallback.is_default = true;
        await nextFallback.save();
      }
    }

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_resume_version",
        targetId: existing._id,
        action: "DELETE_RESUME_VERSION",
        changedFields: ["is_deleted"],
        previousValues: { name: existing.name },
        newValues: { is_deleted: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { msg: "Resume version removed" };
  };

  const updateResumeShare = async (actor, targetStudentId, resumeId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(resumeId, "resume version ID");

    const existing = await ResumeVersion.findOne({
      _id: resumeId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Resume version not found");
    }

    const shareEnabled = Boolean(payload.share_enabled);
    if (shareEnabled) {
      existing.share_enabled = true;
      if (!existing.share_token || payload.regenerate_token) {
        existing.share_token = crypto.randomBytes(32).toString("hex");
      }
      if (payload.expires_in_days) {
        const exp = new Date();
        exp.setDate(exp.getDate() + Number(payload.expires_in_days));
        existing.share_expires_at = exp;
      } else {
        existing.share_expires_at = null;
      }
      if (existing.visibility === RESUME_VERSION_VISIBILITY.PRIVATE) {
        existing.visibility = RESUME_VERSION_VISIBILITY.SHARED;
      }
    } else {
      existing.share_enabled = false;
      existing.share_token = null;
      existing.share_expires_at = null;
    }

    await existing.save();

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_resume_version",
        targetId: existing._id,
        action: shareEnabled ? "ENABLE_RESUME_SHARE" : "DISABLE_RESUME_SHARE",
        changedFields: ["share_enabled", "share_token", "visibility"],
        previousValues: {},
        newValues: { share_enabled: shareEnabled },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return {
      msg: shareEnabled ? "Share link enabled" : "Share link revoked",
      resume_version: formatVersionMetadata(existing),
    };
  };

  const previewResumeVersion = async (actor, targetStudentId, resumeId) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");
    assertValidId(resumeId, "resume version ID");

    const doc = await ResumeVersion.findOne({
      _id: resumeId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!doc) {
      throw new NotFoundError("Resume version not found");
    }
    if (!assertVisibleToActor(scopedActor, student._id, doc)) {
      throw new UnauthorizedError("This resume version is private");
    }

    const isOwnerOrAdmin =
      scopedActor.role === "Admin" || String(scopedActor.userId) === String(student._id);
    const [composed, layout] = await Promise.all([
      composeCanonicalResumeData(doc, student, { isOwnerOrAdmin }),
      resolveTemplateLayout(doc.template_id),
    ]);

    const { compiledHtml, compiledCss } = compileHtml(
      layout.html,
      layout.css,
      composed.safeRenderData,
      composed.safeStudentForRender,
    );

    return {
      resume_version: formatVersionMetadata(doc),
      template_name: layout.template_name,
      composed_content: composed.composed,
      compiled_html: compiledHtml,
      compiled_css: compiledCss,
    };
  };

  const generateResumePdf = async (actor, targetStudentId, resumeId, reqMeta = {}) => {
    const preview = await previewResumeVersion(actor, targetStudentId, resumeId);
    const pdfBuffer = await generatePdf(preview.compiled_html);

    await ResumeVersion.findByIdAndUpdate(resumeId, {
      $set: { last_generated_at: new Date() },
    });

    await recordAuditLog(
      {
        actorId: actor.userId,
        actorRole: actor.role,
        targetUserId: targetStudentId,
        targetModel: "tbl_resume_version",
        targetId: resumeId,
        action: "GENERATE_RESUME_PDF",
        changedFields: ["last_generated_at"],
        previousValues: {},
        newValues: { resume_name: preview.resume_version.name },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const safeFileName =
      sanitizePlainText(preview.resume_version.name).replace(/[^a-zA-Z0-9-_]+/g, "_") || "resume";

    return {
      pdfBuffer,
      filename: `${safeFileName}.pdf`,
    };
  };

  const getSharedResumeByToken = async (shareToken) => {
    if (!shareToken || typeof shareToken !== "string" || shareToken.length < 32) {
      throw new BadRequestError("Invalid share token");
    }

    const doc = await ResumeVersion.findOne({
      share_token: shareToken,
      share_enabled: true,
      is_deleted: false,
    });
    if (!doc) {
      throw new NotFoundError("Shared resume not found or link has been revoked");
    }
    if (
      doc.visibility !== RESUME_VERSION_VISIBILITY.SHARED &&
      doc.visibility !== RESUME_VERSION_VISIBILITY.PUBLIC
    ) {
      throw new UnauthorizedError("This shared resume is no longer public");
    }
    if (doc.share_expires_at && new Date(doc.share_expires_at) <= new Date()) {
      throw new UnauthorizedError("This resume share link has expired");
    }

    const student = await loadTargetStudent(doc.student_id);
    const [composed, layout] = await Promise.all([
      composeCanonicalResumeData(doc, student, {
        isOwnerOrAdmin: false,
        maskPrivateContact: true,
      }),
      resolveTemplateLayout(doc.template_id),
    ]);

    const { compiledHtml } = compileHtml(
      layout.html,
      layout.css,
      composed.safeRenderData,
      composed.safeStudentForRender,
    );

    return {
      name: doc.name,
      target_role: doc.target_role || "",
      template_name: layout.template_name,
      composed_content: composed.composed,
      compiled_html: compiledHtml,
    };
  };

  return {
    getMetadata,
    listStudentResumeVersions,
    getResumeVersionById,
    createResumeVersion,
    updateResumeVersion,
    duplicateResumeVersion,
    setDefaultResumeVersion,
    deleteResumeVersion,
    updateResumeShare,
    previewResumeVersion,
    generateResumePdf,
    getSharedResumeByToken,
  };
};

export const resumeVersionService = createResumeVersionService();
