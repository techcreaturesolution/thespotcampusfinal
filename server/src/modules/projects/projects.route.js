import { Router } from "express";
import { authorizePermissions } from "../../middleware/authMiddleware.js";
import {
  validateStudentIdParam,
  validateProjectIdParam,
  validateSkillIdParam,
  validateLinkIdParam,
  validateProjectListQuery,
  validateCreateProject,
  validateUpdateProject,
  validateAddProjectSkill,
  validateReorderProjects,
  validateCreateProjectLink,
  validateUpdateProjectLink,
  validateReorderProjectLinks,
} from "./projects.validator.js";
import {
  getProjectMetadata,
  listMyProjects,
  getMyProject,
  createMyProject,
  updateMyProject,
  deleteMyProject,
  reorderMyProjects,
  addMyProjectSkill,
  removeMyProjectSkill,
  listMyProjectLinks,
  addMyProjectLink,
  updateMyProjectLink,
  deleteMyProjectLink,
  reorderMyProjectLinks,
  listStudentProjects,
  getStudentProject,
  createStudentProject,
  updateStudentProject,
  deleteStudentProject,
  reorderStudentProjects,
  addStudentProjectSkill,
  removeStudentProjectSkill,
  listStudentProjectLinks,
  addStudentProjectLink,
  updateStudentProjectLink,
  deleteStudentProjectLink,
  reorderStudentProjectLinks,
} from "./projects.controller.js";

const router = Router();

router.get(
  "/meta",
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  getProjectMetadata,
);

// Student self-service project endpoints
router
  .route("/me")
  .get(authorizePermissions("Student"), validateProjectListQuery, listMyProjects)
  .post(authorizePermissions("Student"), validateCreateProject, createMyProject);

router.patch("/me/reorder", authorizePermissions("Student"), validateReorderProjects, reorderMyProjects);

router
  .route("/me/:projectId")
  .get(authorizePermissions("Student"), validateProjectIdParam, getMyProject)
  .patch(authorizePermissions("Student"), validateProjectIdParam, validateUpdateProject, updateMyProject)
  .delete(authorizePermissions("Student"), validateProjectIdParam, deleteMyProject);

router.post(
  "/me/:projectId/skills",
  authorizePermissions("Student"),
  validateProjectIdParam,
  validateAddProjectSkill,
  addMyProjectSkill,
);

router.delete(
  "/me/:projectId/skills/:skillId",
  authorizePermissions("Student"),
  validateProjectIdParam,
  validateSkillIdParam,
  removeMyProjectSkill,
);

router
  .route("/me/:projectId/links")
  .get(authorizePermissions("Student"), validateProjectIdParam, listMyProjectLinks)
  .post(
    authorizePermissions("Student"),
    validateProjectIdParam,
    validateCreateProjectLink,
    addMyProjectLink,
  );

router.patch(
  "/me/:projectId/links/reorder",
  authorizePermissions("Student"),
  validateProjectIdParam,
  validateReorderProjectLinks,
  reorderMyProjectLinks,
);

router
  .route("/me/:projectId/links/:linkId")
  .patch(
    authorizePermissions("Student"),
    validateProjectIdParam,
    validateLinkIdParam,
    validateUpdateProjectLink,
    updateMyProjectLink,
  )
  .delete(
    authorizePermissions("Student"),
    validateProjectIdParam,
    validateLinkIdParam,
    deleteMyProjectLink,
  );

// Authorized scoped student project endpoints
router
  .route("/student/:studentId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateProjectListQuery,
    listStudentProjects,
  )
  .post(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateCreateProject,
    createStudentProject,
  );

router.patch(
  "/student/:studentId/reorder",
  authorizePermissions("Student", "College", "TPO", "Admin"),
  validateStudentIdParam,
  validateReorderProjects,
  reorderStudentProjects,
);

router
  .route("/student/:studentId/:projectId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateProjectIdParam,
    getStudentProject,
  )
  .patch(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateProjectIdParam,
    validateUpdateProject,
    updateStudentProject,
  )
  .delete(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateProjectIdParam,
    deleteStudentProject,
  );

router.post(
  "/student/:studentId/:projectId/skills",
  authorizePermissions("Student", "College", "TPO", "Admin"),
  validateStudentIdParam,
  validateProjectIdParam,
  validateAddProjectSkill,
  addStudentProjectSkill,
);

router.delete(
  "/student/:studentId/:projectId/skills/:skillId",
  authorizePermissions("Student", "College", "TPO", "Admin"),
  validateStudentIdParam,
  validateProjectIdParam,
  validateSkillIdParam,
  removeStudentProjectSkill,
);

router
  .route("/student/:studentId/:projectId/links")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateProjectIdParam,
    listStudentProjectLinks,
  )
  .post(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateProjectIdParam,
    validateCreateProjectLink,
    addStudentProjectLink,
  );

router.patch(
  "/student/:studentId/:projectId/links/reorder",
  authorizePermissions("Student", "College", "TPO", "Admin"),
  validateStudentIdParam,
  validateProjectIdParam,
  validateReorderProjectLinks,
  reorderStudentProjectLinks,
);

router
  .route("/student/:studentId/:projectId/links/:linkId")
  .patch(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateProjectIdParam,
    validateLinkIdParam,
    validateUpdateProjectLink,
    updateStudentProjectLink,
  )
  .delete(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateProjectIdParam,
    validateLinkIdParam,
    deleteStudentProjectLink,
  );

export default router;
