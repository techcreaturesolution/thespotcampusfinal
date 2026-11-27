import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import "express-async-errors";
import {
  createProfileCompletenessService,
  profileCompletenessService as singletonService,
} from "../src/modules/profileCompleteness/profileCompleteness.service.js";
import ProfileCompletenessRouter from "../src/modules/profileCompleteness/profileCompleteness.route.js";
import errorHandlerMiddleware from "../src/middleware/errorHandlerMiddleware.js";
import { UnauthorizedError } from "../src/errors/customErrors.js";

const buildQueryStub = (rows) => {
  const query = {
    select() {
      return query;
    },
    populate() {
      return query;
    },
    lean: async () => rows,
  };
  return query;
};

const createMutableInMemoryFixtures = () => {
  const studentAId = "65f000000000000000000201";
  const studentBId = "65f000000000000000000202";
  const college1Id = "65f000000000000000000901";
  const college2Id = "65f000000000000000000902";

  const state = {
    students: {
      [studentAId]: {
        _id: studentAId,
        role: "Student",
        college_id: college1Id,
        university_id: "65f000000000000000000801",
        degree_id: null,
        branch_id: null,
        student_name: "Kiran Joshi",
        student_email: "kiran@example.com",
        student_contact: "9988776655",
        is_deleted: false,
      },
      [studentBId]: {
        _id: studentBId,
        role: "Student",
        college_id: college2Id,
        university_id: "65f000000000000000000802",
        student_name: "Other Institute Student",
        student_email: "other@example.com",
        student_contact: "9111111111",
        is_deleted: false,
      },
    },
    academicHistoryCounts: { [studentAId]: 0, [studentBId]: 0 },
    skills: [],
    projects: [],
    projectLinks: [],
    certifications: [],
    internships: [],
    resumeVersions: [],
    documents: [],
  };

  const service = createProfileCompletenessService({
    studentModel: {
      findById: (id) => buildQueryStub(state.students[String(id)] || null),
    },
    academicHistoryModel: {
      countDocuments: async ({ student_id }) => state.academicHistoryCounts[String(student_id)] || 0,
    },
    studentSkillModel: {
      find: ({ student_id }) =>
        buildQueryStub(
          state.skills.filter((s) => String(s.student_id) === String(student_id) && !s.is_deleted),
        ),
    },
    projectModel: {
      find: ({ student_id }) =>
        buildQueryStub(
          state.projects.filter((p) => String(p.student_id) === String(student_id) && !p.is_deleted),
        ),
    },
    projectLinkModel: {
      find: ({ student_id }) =>
        buildQueryStub(
          state.projectLinks.filter(
            (l) => String(l.student_id) === String(student_id) && !l.is_deleted,
          ),
        ),
    },
    certificationModel: {
      find: ({ student_id }) =>
        buildQueryStub(
          state.certifications.filter(
            (c) => String(c.student_id) === String(student_id) && !c.is_deleted,
          ),
        ),
    },
    internshipModel: {
      find: ({ student_id }) =>
        buildQueryStub(
          state.internships.filter(
            (i) => String(i.student_id) === String(student_id) && !i.is_deleted,
          ),
        ),
    },
    resumeVersionModel: {
      find: ({ student_id }) =>
        buildQueryStub(
          state.resumeVersions.filter(
            (v) => String(v.student_id) === String(student_id) && !v.is_deleted,
          ),
        ),
    },
    documentModel: {
      find: ({ owner_id }) =>
        buildQueryStub(
          state.documents.filter((d) => String(d.owner_id) === String(owner_id) && !d.is_deleted),
        ),
    },
    resolveActorScope: async (actor) => ({ ...actor }),
    assertCanAccessStudent: (scopedActor, student) => {
      if (scopedActor.role === "Admin") return;
      if (scopedActor.role === "Student") {
        if (String(scopedActor.userId) !== String(student._id)) {
          throw new UnauthorizedError("You can only view your own profile");
        }
        return;
      }
      if (scopedActor.role === "College") {
        if (String(scopedActor.userId) !== String(student.college_id)) {
          throw new UnauthorizedError("Cross-institute access denied");
        }
        return;
      }
      throw new UnauthorizedError("Unauthorized access");
    },
  });

  return { state, service, studentAId, studentBId, college1Id, college2Id };
};

test("S1-10 integration: live state changes across S1-01..S1-09 deterministically update completeness", async () => {
  const { state, service, studentAId } = createMutableInMemoryFixtures();
  const actor = { userId: studentAId, role: "Student" };

  // Initial: identity complete (15) + academic university+college (5) => 20%
  const initial = await service.getMyCompleteness(actor);
  assert.equal(initial.completeness.percentage, 20);

  // Update S1-01 Academic Profile + History to full (adds remaining 20 pts => 40%)
  Object.assign(state.students[studentAId], {
    degree_id: "deg1",
    branch_id: "br1",
    student_enrollment: "EN2026",
    student_current_sem: "6",
    academic_year: "2025-26",
    academic_batch: "2022-2026",
    cgpa: 8.8,
  });
  state.academicHistoryCounts[studentAId] = 1;
  const afterS101 = await service.getMyCompleteness(actor);
  assert.equal(afterS101.completeness.percentage, 40);

  // Add S1-02 + S1-03 Skills with proficiency (3 active valid skills => +20 => 60%)
  state.skills.push(
    {
      student_id: studentAId,
      skill_id: { _id: "1", name: "React", is_active: true, is_deleted: false },
      proficiency: "Advanced",
      is_deleted: false,
    },
    {
      student_id: studentAId,
      skill_id: { _id: "2", name: "Node", is_active: true, is_deleted: false },
      proficiency: "Intermediate",
      is_deleted: false,
    },
    {
      student_id: studentAId,
      skill_id: { _id: "3", name: "SQL", is_active: true, is_deleted: false },
      proficiency: "Beginner",
      is_deleted: false,
    },
  );
  const afterS103 = await service.getMyCompleteness(actor);
  assert.equal(afterS103.completeness.percentage, 60);

  // Add S1-04 Project + S1-05 GitHub Link (+20 => 80%)
  state.projects.push({
    _id: "proj1",
    student_id: studentAId,
    title: "Placement Tracker",
    description: "Built with Express + React",
    status: "Completed",
    is_deleted: false,
  });
  state.projectLinks.push({
    project_id: "proj1",
    student_id: studentAId,
    link_type: "GITHUB_REPOSITORY",
    url: "https://github.com/kiran/placement-tracker",
    is_deleted: false,
  });
  const afterS105 = await service.getMyCompleteness(actor);
  assert.equal(afterS105.completeness.percentage, 80);

  // Add S1-06 Certification & S1-07 Internship (optional enrichment updates status/counts, core stays 80%)
  state.certifications.push({
    student_id: studentAId,
    title: "AWS Cloud Practitioner",
    issuing_organization: "AWS",
    issue_date: "2025-05-01",
    status: "Active",
    is_deleted: false,
  });
  state.internships.push({
    student_id: studentAId,
    role_title: "Backend Intern",
    organization_name: "Tech Corp",
    start_date: "2025-06-01",
    status: "Active",
    is_deleted: false,
  });
  const afterS107 = await service.getMyCompleteness(actor);
  assert.equal(afterS107.completeness.percentage, 80);
  assert.equal(
    afterS107.completeness.sections.find((s) => s.key === "certifications").counts.active_count,
    1,
  );
  assert.equal(
    afterS107.completeness.sections.find((s) => s.key === "internships").counts.active_count,
    1,
  );

  // Add S1-08 Resume Version (+10 => 90%) and S1-09 Resume Upload (+10 => 100%)
  state.resumeVersions.push({
    student_id: studentAId,
    name: "Fullstack Placement CV",
    status: "Active",
    is_deleted: false,
  });
  assert.equal((await service.getMyCompleteness(actor)).completeness.percentage, 90);

  state.documents.push({
    owner_id: studentAId,
    document_type: "RESUME",
    status: "Available",
    malware_scan_status: "Clean",
    file_size: 20480,
    original_filename: "kiran-cv.pdf",
    is_deleted: false,
  });
  const afterS109 = await service.getMyCompleteness(actor);
  assert.equal(afterS109.completeness.percentage, 100);
  assert.equal(afterS109.completeness.is_complete, true);

  // Deleting resume document immediately lowers score back to 90% (no stale cache)
  state.documents[0].is_deleted = true;
  assert.equal((await service.getMyCompleteness(actor)).completeness.percentage, 90);
});

test("S1-10 security & HTTP API: enforces ownership, cross-institute isolation, ID validation, and unforgeable calculation", async () => {
  const { service, studentAId, studentBId, college1Id, college2Id } = createMutableInMemoryFixtures();

  const origGetMy = singletonService.getMyCompleteness;
  const origGetStudent = singletonService.getStudentCompleteness;
  singletonService.getMyCompleteness = service.getMyCompleteness;
  singletonService.getStudentCompleteness = service.getStudentCompleteness;

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
  app.use(
    "/api/profile-completeness",
    (req, res, next) => {
      if (!req.user) return res.status(401).json({ msg: "authentication invalid" });
      next();
    },
    ProfileCompletenessRouter,
  );
  app.use(errorHandlerMiddleware);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/profile-completeness`;

  const reqJson = async (pathname, headers = {}) => {
    const response = await fetch(`${baseUrl}${pathname}`, { headers });
    const body = await response.json();
    return { status: response.status, body };
  };

  try {
    // 1. Unauthenticated blocked
    const unauthRes = await reqJson("/me");
    assert.equal(unauthRes.status, 401);

    // 2. Rules endpoint accessible for authenticated users
    const rulesRes = await reqJson("/rules", {
      "x-test-role": "Student",
      "x-test-id": studentAId,
    });
    assert.equal(rulesRes.status, 200);
    assert.equal(rulesRes.body.sections.length, 7);

    // 3. Client cannot spoof percentage via query parameters
    const meRes = await reqJson("/me?percentage=100", {
      "x-test-role": "Student",
      "x-test-id": studentAId,
    });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.completeness.percentage, 20);

    // 4. IDOR: Student A cannot view Student B completeness
    const idorRes = await reqJson(`/student/${studentBId}`, {
      "x-test-role": "Student",
      "x-test-id": studentAId,
    });
    assert.equal(idorRes.status, 403);

    // 5. Cross-institute: College 2 cannot view Student A (who belongs to College 1)
    const crossInstituteRes = await reqJson(`/student/${studentAId}`, {
      "x-test-role": "College",
      "x-test-id": college2Id,
    });
    assert.equal(crossInstituteRes.status, 403);

    // 6. Same-institute: College 1 CAN view Student A
    const sameInstituteRes = await reqJson(`/student/${studentAId}`, {
      "x-test-role": "College",
      "x-test-id": college1Id,
    });
    assert.equal(sameInstituteRes.status, 200);
    assert.equal(sameInstituteRes.body.completeness.percentage, 20);

    // 7. Invalid studentId param fails validation cleanly
    const badIdRes = await reqJson("/student/not-a-valid-id", {
      "x-test-role": "Admin",
      "x-test-id": "65f000000000000000000999",
    });
    assert.equal(badIdRes.status, 400);
  } finally {
    singletonService.getMyCompleteness = origGetMy;
    singletonService.getStudentCompleteness = origGetStudent;
    await new Promise((resolve) => server.close(resolve));
  }
});
