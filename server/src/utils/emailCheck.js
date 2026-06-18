import tbl_admin from "../modules/auth/admin.model.js";
import tbl_university from "../modules/university/university.model.js";
import tbl_college from "../modules/college/college.model.js";
import tbl_student from "../modules/student/student.model.js";
import tbl_company from "../modules/company/company.model.js";
import tbl_tpo from "../modules/tpo/tpo.model.js";

export const isEmailExists = async (email) => {
  if (!email) return false;
  const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const emailRegex = new RegExp(`^${escapedEmail}$`, "i");

  const admin = await tbl_admin.findOne({ admin_email: emailRegex });
  if (admin) return true;

  const university = await tbl_university.findOne({ university_email: emailRegex });
  if (university) return true;

  const college = await tbl_college.findOne({ college_email: emailRegex });
  if (college) return true;

  const student = await tbl_student.findOne({ student_email: emailRegex });
  if (student) return true;

  const company = await tbl_company.findOne({ company_email: emailRegex });
  if (company) return true;

  const tpo = await tbl_tpo.findOne({ tpo_email: emailRegex });
  if (tpo) return true;

  return false;
};
