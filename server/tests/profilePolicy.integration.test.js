import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import "express-async-errors";
import {
  createProfilePolicyService,
  profilePolicyService as singletonService,
} from "../src/modules/profilePolicy/profilePolicy.service.js";
import ProfilePolicyRouter from "../src/modules/profilePolicy/profilePolicy.route.js";
import errorHandlerMiddleware from "../src/middleware/errorHandlerMiddleware.js";
import {
  PROFILE_VALIDATION_CODES,
  PROFILE_VISIBILITY,
  PROFILE_VISIBILITY_OVERRIDE,
} from "../src/utils/constants.js";
import { UnauthorizedError } from "../src/errors/customErrors.js";

const buildQueryStub = (rows) => {
  const query = {
    select() {
      return query;
    },
    populate() {
      return query;
    },
    sort() {
      return query;
    },
    skip() {
      return query;
    },
    limit() {
      return query;
    },
    lean: async () => rows,
  };
  return query;
};

const createInMemoryPolicyFixture = () => {
  const studentAId = "65f000000000000000000401";
  const studentBId = "65f000000000000000000402";
  const inst1Id = "65f000000000000000000811";
  const inst2Id = "65f000000000000000000812";

  const state = {
    students: {
      [studentAId]: {
        _id: studentAId,
        role: "Student",
        college_id: inst1Id,
        university_id: { _id: "u1", university_name: "State Univ" },
        degree_id: { _id: "d1", degree_name: "B.Tech" },
        branch_id: { _id: "b1", branch_name: "Computer Engineering" },
        student_name: "Meera Nair",
        student_email: "meera@example.com",
        student_contact: "9876501234",
        student_enrollment: "EN202501",
        student_current_sem: "6",
        academic_year: "2025-26",
        academic_batch: "2022-2026",
        academic_status: "Active",
        isVerifiedByTPO: true,
        profile_visibility: PROFILE_VISIBILITY.PRIVATE,
        is_published: false,
        published_at: null,
        visibility_updated_at: null,
        visibility_override: PROFILE_VISIBILITY_OVERRIDE.NONE,
        visibility_override_reason: "",
        is_deleted: false,
      },
      [studentBId]: {
        _id: studentBId,
        role: "Student",
        college_id: inst2Id,
        university_id: { _id: "u2", university_name: "Other Univ" },
        student_name: "Invalid Peer Student",
        student_email: "peer@example.com",
        student_contact: "",
        profile_visibility: PROFILE_VISIBILITY.PRIVATE,
        is_published: false,
        visibility_override: PROFILE_VISIBILITY_OVERRIDE.NONE,
        is_deleted: false,
      },
    },
    skills: [
      {
        _id: "sk_rel_1",
        student_id: studentAId,
        skill_id: { _id: "sk1", name: "Node.js", category: "Frameworks", is_active: true, is_deleted: false },
        proficiency: "Advanced",
        is_deleted: false,
      },
    ],
    projects: [
      {
        _id: "proj_pub",
        student_id: studentAId,
        title: "Open Source Linter",
        description: "CLI static checker",
        status: "Completed",
        visibility: "Public",
        is_deleted: false,
      },
      {
        _id: "proj_priv",
        student_id: studentAId,
        title: "Internal Tool",
        description: "Hidden from public",
        status: "Completed",
        visibility: "Private",
        is_deleted: false,
      },
    ],
    projectLinks: [],
    certifications: [
      {
        _id: "cert_pub",
        student_id: studentAId,
        title: "AWS Developer",
        issuing_organization: "AWS",
        issue_date: "2025-03-01",
        does_not_expire: true,
        status: "Active",
        visibility: "Public",
        certificate_file: { filename: "private-proof.pdf" },
        is_deleted: false,
      },
    ],
    internships: [],
    resumeVersions: [],
    documents: [],
    auditLogs: [],
  };

  const applyUpdate = (id, updateObj) => {
    const doc = state.students[String(id)];
    if (!doc) return null;
    if (updateObj?.$set) Object.assign(doc, updateObj.$set);
    return doc;
  };

  const service = createProfilePolicyService({
    studentModel: {
      findById: (id) => buildQueryStub(state.students[String(id)] || null),
      findOneAndUpdate: async (filter, update) => {
        const doc = state.students[String(filter._id)];
        if (!doc || doc.is_deleted) return null;
        if (filter.visibility_override?.$ne && doc.visibility_override === filter.visibility_override.$ne) {
          return null;
        }
        if (filter.visibility_override && typeof filter.visibility_override === "string" && doc.visibility_override !== filter.visibility_override) {
          return null;
        }
        return applyUpdate(doc._id, update);
      },
      findByIdAndUpdate: async (id, update) => applyUpdate(id, update),
      find: (query) => {
        const matches = Object.values(state.students).filter((s) => {
          if (query.is_deleted?.$ne && s.is_deleted === query.is_deleted.$ne) return false;
          if (query.is_published !== undefined && s.is_published !== query.is_published) return false;
          if (query.profile_visibility && s.profile_visibility !== query.profile_visibility) return false;
          if (query.visibility_override?.$nin && query.visibility_override.$nin.includes(s.visibility_override)) {
            return false;
          }
          return true;
        });
        return buildQueryStub(matches);
      },
    },
    academicHistoryModel: { countDocuments: async () => 1 },
    studentSkillModel: {
      find: ({ student_id }) =>
        buildQueryStub(state.skills.filter((s) => String(s.student_id) === String(student_id) && !s.is_deleted)),
    },
    projectModel: {
      find: ({ student_id }) =>
        buildQueryStub(state.projects.filter((p) => String(p.student_id) === String(student_id) && !p.is_deleted)),
    },
    projectLinkModel: {
      find: ({ student_id }) =>
        buildQueryStub(state.projectLinks.filter((l) => String(l.student_id) === String(student_id))),
    },
    certificationModel: {
      find: ({ student_id }) =>
        buildQueryStub(state.certifications.filter((c) => String(c.student_id) === String(student_id))),
    },
    internshipModel: {
      find: ({ student_id }) =>
        buildQueryStub(state.internships.filter((i) => String(i.student_id) === String(student_id))),
    },
    resumeVersionModel: {
      find: ({ student_id }) =>
        buildQueryStub(state.resumeVersions.filter((v) => String(v.student_id) === String(student_id))),
    },
    documentModel: {
      find: ({ owner_id }) =>
        buildQueryStub(state.documents.filter((d) => String(d.owner_id) === String(owner_id))),
    },
    auditLogModel: {
      create: async (entry) => {
        state.auditLogs.push(entry);
        return entry;
      },
    },
    resolveActorScope: async (actor) => ({ ...actor }),
    assertCanAccessStudent: (scopedActor, student) => {
      if (scopedActor.role === "Admin") return;
      if (scopedActor.role === "Student" && String(scopedActor.userId) === String(student._id)) return;
      if (scopedActor.role === "College" && String(scopedActor.userId) === String(student.college_id)) return;
      throw new UnauthorizedError("Access denied");
    },
    resolveStudentInstituteId: (student) => (student?.college_id ? String(student.college_id) : null),
    resolveActorInstituteId: (actor) =>
      actor?.role === "College" ? String(actor.userId) : null,
  });

  return { state, service, studentAId, studentBId, inst1Id, inst2Id };
};

test("S1-11 integration & security: publish lifecycle, mass assignment protection, IDOR, public allowlist, and admin override", async () => {
  const { state, service, studentAId, studentBId, inst1Id, inst2Id } = createInMemoryPolicyFixture();

  const methodNames = Object.keys(service);
  const origMethods = Object.fromEntries(methodNames.map((k) => [k, singletonService[k]]));
  Object.assign(singletonService, service);

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const roleHeader = req.get("x-test-role");
    const idHeader = req.get("x-test-id");
    if (roleHeader && idHeader) {
      req.user = { userId: idHeader, role: roleHeader };
    }
    next();
  });

  // Note: mock auth middleware for tests using header identity when testing /me, /student, /view, /admin
  app.use(
    "/api/profile-policy",
    async (req, res, next) => {
      if (
        !req.path.startsWith("/public") &&
        req.path !== "/discover" &&
        req.path !== "/meta" &&
        !req.user
      ) {
        return res.status(401).json({ msg: "authentication invalid" });
      }
      next();
    },
    (req, res, next) => {
      // Bypass real JWT cookie check on router routes by pre-setting req.user via custom mount only where header set
      next();
    },
  );

  // Build test router reusing real controller + validator behavior with header auth test middleware
  const {
    validateStudentIdParam,
    validatePublishBody,
    validateVisibilityBody,
    validateDiscoverQuery,
    validateAdminOverrideBody,
  } = await import("../src/modules/profilePolicy/profilePolicy.validator.js");
  const ctrl = await import("../src/modules/profilePolicy/profilePolicy.controller.js");
  const { authorizePermissions } = await import("../src/middleware/authMiddleware.js");

  const testRouter = express.Router();
  const requireTestAuth = (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: "authentication invalid" });
    next();
  };
  testRouter.get("/meta", ctrl.getPolicyMetadata);
  testRouter.get("/discover", validateDiscoverQuery, ctrl.discoverPublicProfiles);
  testRouter.get("/public/:studentId", validateStudentIdParam, ctrl.getPublicProfile);
  testRouter.get("/me", requireTestAuth, authorizePermissions("Student"), ctrl.getMyPolicyStatus);
  testRouter.post("/me/publish", requireTestAuth, authorizePermissions("Student"), validatePublishBody, ctrl.publishMyProfile);
  testRouter.post("/me/unpublish", requireTestAuth, authorizePermissions("Student"), ctrl.unpublishMyProfile);
  testRouter.patch("/me/visibility", requireTestAuth, authorizePermissions("Student"), validateVisibilityBody, ctrl.updateMyVisibility);
  testRouter.get("/student/:studentId", requireTestAuth, authorizePermissions("Student", "College", "TPO", "University", "Admin"), validateStudentIdParam, ctrl.getStudentPolicyStatus);
  testRouter.get("/view/:studentId", requireTestAuth, authorizePermissions("Student", "College", "TPO", "University", "Company", "Admin"), validateStudentIdParam, ctrl.viewProfileWithPolicy);
  testRouter.patch("/admin/:studentId/override", requireTestAuth, authorizePermissions("Admin"), validateStudentIdParam, validateAdminOverrideBody, ctrl.adminOverrideStudentVisibility);

  const serverApp = express();
  serverApp.use(express.json());
  serverApp.use((req, _res, next) => {
    const roleHeader = req.get("x-test-role");
    const idHeader = req.get("x-test-id");
    if (roleHeader && idHeader) req.user = { userId: idHeader, role: roleHeader };
    next();
  });
  serverApp.use("/api/profile-policy", testRouter);
  serverApp.use(errorHandlerMiddleware);

  const server = http.createServer(serverApp);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/profile-policy`;

  const callApi = async (method, pathname, { headers = {}, body = null } = {}) => {
    const res = await fetch(`${baseUrl}${pathname}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, body: await res.json() };
  };

  try {
    // Verify real router mount imported cleanly too
    assert.ok(ProfilePolicyRouter);

    // 1. Student B has invalid profile -> publish rejected with 422 NOT_PUBLISHABLE
    const invalidPub = await callApi("POST", "/me/publish", {
      headers: { "x-test-role": "Student", "x-test-id": studentBId },
      body: { visibility: "Public" },
    });
    assert.equal(invalidPub.status, 422);
    assert.equal(invalidPub.body.code, PROFILE_VALIDATION_CODES.NOT_PUBLISHABLE);

    // 2. Private profile hidden from /public & /discover
    const privPubCheck = await callApi("GET", `/public/${studentAId}`);
    assert.equal(privPubCheck.status, 404);
    const discoverBefore = await callApi("GET", "/discover");
    assert.equal(discoverBefore.status, 200);
    assert.equal(discoverBefore.body.profiles.length, 0);

    // 3. Mass assignment rejected
    const massAssign = await callApi("PATCH", "/me/visibility", {
      headers: { "x-test-role": "Student", "x-test-id": studentAId },
      body: { visibility: "Public", is_published: true, institute_id: inst2Id },
    });
    assert.equal(massAssign.status, 403);

    // 4. Publish as Public succeeds (student A is valid + publishable)
    const pubRes = await callApi("POST", "/me/publish", {
      headers: { "x-test-role": "Student", "x-test-id": studentAId },
      body: { visibility: "Public" },
    });
    assert.equal(pubRes.status, 200);
    assert.equal(pubRes.body.visibility.profile_visibility, "Public");
    assert.equal(pubRes.body.visibility.is_published, true);

    // 5. Public endpoint & /discover now show allowlisted safe profile ONLY
    const pubView = await callApi("GET", `/public/${studentAId}`);
    assert.equal(pubView.status, 200);
    assert.equal(pubView.body.profile.student_name, "Meera Nair");
    assert.equal("student_email" in pubView.body.profile, false);
    assert.equal("student_contact" in pubView.body.profile, false);
    assert.equal("student_enrollment" in pubView.body.profile, false);
    assert.equal(pubView.body.profile.projects.length, 1); // private project filtered!
    assert.equal(pubView.body.profile.certifications[0].has_attachment, false);

    const discoverAfter = await callApi("GET", "/discover");
    assert.equal(discoverAfter.body.profiles.length, 1);

    // 6. Cross-institute & IDOR blocked on /student/:studentId
    const idorPolicy = await callApi("GET", `/student/${studentBId}`, {
      headers: { "x-test-role": "Student", "x-test-id": studentAId },
    });
    assert.equal(idorPolicy.status, 403);

    const crossInst = await callApi("GET", `/student/${studentAId}`, {
      headers: { "x-test-role": "College", "x-test-id": inst2Id },
    });
    assert.equal(crossInst.status, 403);

    const sameInst = await callApi("GET", `/student/${studentAId}`, {
      headers: { "x-test-role": "College", "x-test-id": inst1Id },
    });
    assert.equal(sameInst.status, 200);

    // 7. Admin override suspends visibility, audits change, hides from /public & /discover, blocks owner republish
    const adminRes = await callApi("PATCH", `/admin/${studentAId}/override`, {
      headers: { "x-test-role": "Admin", "x-test-id": "65f000000000000000000999" },
      body: { visibility_override: "SUSPENDED", reason: "Policy review" },
    });
    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.body.visibility.profile_visibility, "Private");

    const pubAfterOverride = await callApi("GET", `/public/${studentAId}`);
    assert.equal(pubAfterOverride.status, 404);
    assert.equal((await callApi("GET", "/discover")).body.profiles.length, 0);

    const ownerTryPublic = await callApi("PATCH", "/me/visibility", {
      headers: { "x-test-role": "Student", "x-test-id": studentAId },
      body: { visibility: "Public" },
    });
    assert.equal(ownerTryPublic.status, 403);
    assert.ok(state.auditLogs.some((a) => a.action === "PUBLISH_PROFILE"));
    assert.ok(state.auditLogs.some((a) => a.action === "ADMIN_OVERRIDE_PROFILE_VISIBILITY"));
  } finally {
    Object.assign(singletonService, origMethods);
    await new Promise((resolve) => server.close(resolve));
  }
});
