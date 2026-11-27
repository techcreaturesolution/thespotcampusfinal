import { Router } from "express";
import { authorizePermissions } from "../../middleware/authMiddleware.js";
import {
  validateSkillIdParam,
  validateStudentIdParam,
  validateUserSkillIdParam,
  validateSkillSearchQuery,
  validateUserSkillsQuery,
  validateCreateMasterSkill,
  validateUpdateMasterSkill,
  validateAddUserSkill,
  validateUpdateUserSkill,
  validateReorderUserSkills,
} from "./skills.validator.js";
import {
  listProficiencyLevels,
  listMasterSkills,
  getMasterSkill,
  createMasterSkill,
  updateMasterSkill,
  deleteMasterSkill,
  getMySkills,
  addMySkill,
  updateMySkill,
  removeMySkill,
  reorderMySkills,
  getStudentSkills,
  addStudentSkill,
  updateStudentSkill,
  removeStudentSkill,
  reorderStudentSkills,
} from "./skills.controller.js";

const router = Router();

// Canonical Proficiency Levels (ordered master definition)
router.get(
  "/proficiencies",
  authorizePermissions("Student", "College", "TPO", "University", "Admin", "Company"),
  listProficiencyLevels,
);

// Canonical Skills Master (search/list/admin management)
router
  .route("/master")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin", "Company"),
    validateSkillSearchQuery,
    listMasterSkills,
  )
  .post(authorizePermissions("Admin", "College", "TPO"), validateCreateMasterSkill, createMasterSkill);

router
  .route("/master/:skillId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin", "Company"),
    validateSkillIdParam,
    getMasterSkill,
  )
  .patch(authorizePermissions("Admin"), validateSkillIdParam, validateUpdateMasterSkill, updateMasterSkill)
  .delete(authorizePermissions("Admin"), validateSkillIdParam, deleteMasterSkill);

// Student self-service Technical Skills
router
  .route("/me")
  .get(authorizePermissions("Student"), validateUserSkillsQuery, getMySkills)
  .post(authorizePermissions("Student"), validateAddUserSkill, addMySkill);

router.patch("/me/reorder", authorizePermissions("Student"), validateReorderUserSkills, reorderMySkills);

router
  .route("/me/:userSkillId")
  .patch(authorizePermissions("Student"), validateUserSkillIdParam, validateUpdateUserSkill, updateMySkill)
  .delete(authorizePermissions("Student"), validateUserSkillIdParam, removeMySkill);

// Authorized scoped student skills (Student owner, College, TPO, University read-only, Admin)
router
  .route("/student/:studentId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateUserSkillsQuery,
    getStudentSkills,
  )
  .post(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateAddUserSkill,
    addStudentSkill,
  );

router.patch(
  "/student/:studentId/reorder",
  authorizePermissions("Student", "College", "TPO", "Admin"),
  validateStudentIdParam,
  validateReorderUserSkills,
  reorderStudentSkills,
);

router
  .route("/student/:studentId/:userSkillId")
  .patch(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateUserSkillIdParam,
    validateUpdateUserSkill,
    updateStudentSkill,
  )
  .delete(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateUserSkillIdParam,
    removeStudentSkill,
  );

export default router;
