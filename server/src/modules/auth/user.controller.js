import tbl_admin from "./admin.model.js";
import tbl_student from "../student/student.model.js";
import tbl_company from "../company/company.model.js";
import tbl_college from "../college/college.model.js";
import tbl_university from "../university/university.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError, BadRequestError } from "../../errors/customErrors.js";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

export const getCurrentUser = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let user;

    switch (role) {
      case "Admin":
        user = await tbl_admin.findById(userId);
        break;
      case "Student":
        user = await tbl_student.findById(userId).populate("college_id university_id degree_id branch_id");
        break;
      case "Company":
        user = await tbl_company.findById(userId);
        break;
      case "College":
        user = await tbl_college.findById(userId);
        break;
      case "University":
        user = await tbl_university.findById(userId);
        break;
      case "TPO":
        user = await tbl_tpo.findById(userId)
          .populate({
            path: "tpo_college_id",
            populate: { path: "college_university_id" },
          })
          .populate("tpo_degree_id");
        break;
      default:
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: "Invalid role" });
    }

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
    }
    res.status(StatusCodes.OK).json({ user, role });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let user;
    let imageKey = "";
    let publicIdKey = "";

    // 1. Identify Model & Field Keys based on role
    switch (role) {
      case "Admin":
        user = await tbl_admin.findById(userId);
        imageKey = "admin_image";
        publicIdKey = "admin_imagePublicID";
        break;
      case "Student":
        user = await tbl_student.findById(userId);
        imageKey = "student_image";
        publicIdKey = "student_imagePublicID";
        break;
      case "Company":
        user = await tbl_company.findById(userId);
        imageKey = "company_logo";
        publicIdKey = "company_logoPublicID";
        break;
      case "College":
        user = await tbl_college.findById(userId);
        imageKey = "college_logo";
        publicIdKey = "college_logoPublicID";
        break;
      case "University":
        user = await tbl_university.findById(userId);
        imageKey = "university_logo";
        publicIdKey = "university_logoPublicID";
        break;
      case "TPO":
        user = await tbl_tpo.findById(userId);
        imageKey = "tpo_image";
        publicIdKey = "tpo_imagePublicID";
        break;
      default:
        throw new BadRequestError("Invalid role");
    }

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // 2. Extract and prepare whitelisted update object (prevents mass assignment)
    const ALLOWED_PROFILE_FIELDS = {
      Admin: ["admin_name"],
      Student: [
        "student_name",
        "student_contact",
        "student_skills",
        "student_current_sem",
        "student_total_backlog",
        ...(user.isVerifiedByTPO ? [] : ["student_enrollment"]),
      ],
      Company: ["company_name", "company_contact", "company_address", "company_website"],
      College: ["college_name", "college_code", "college_contact", "college_address", "college_website"],
      University: [
        "university_name",
        "university_establishment",
        "university_contact_no",
        "university_address",
        "university_website",
      ],
      TPO: ["tpo_name", "tpo_contact"],
    };

    const allowedKeys = ALLOWED_PROFILE_FIELDS[role] || [];
    const updateData = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    // 3. Handle File Upload
    let oldPublicId = user[publicIdKey];

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      updateData[imageKey] = response.secure_url;
      updateData[publicIdKey] = response.public_id;
    }

    // 4. Update in Database
    let updatedUser;
    switch (role) {
      case "Admin":
        updatedUser = await tbl_admin.findByIdAndUpdate(userId, updateData, { new: true });
        break;
      case "Student":
        updatedUser = await tbl_student.findByIdAndUpdate(userId, updateData, { new: true });
        break;
      case "Company":
        updatedUser = await tbl_company.findByIdAndUpdate(userId, updateData, { new: true });
        break;
      case "College":
        updatedUser = await tbl_college.findByIdAndUpdate(userId, updateData, { new: true });
        break;
      case "University":
        updatedUser = await tbl_university.findByIdAndUpdate(userId, updateData, { new: true });
        break;
      case "TPO":
        updatedUser = await tbl_tpo.findByIdAndUpdate(userId, updateData, { new: true })
          .populate({
            path: "tpo_college_id",
            populate: { path: "college_university_id" },
          })
          .populate("tpo_degree_id");
        break;
    }

    // 5. Cleanup Old Image from Cloudinary if successfully uploaded new one
    if (req.file && oldPublicId) {
      try {
        await cloudinary.v2.uploader.destroy(oldPublicId);
      } catch (err) {
        console.error("Cloudinary delete error:", err);
      }
    }

    res.status(StatusCodes.OK).json({ msg: "Profile updated successfully", user: updatedUser, role });
  } catch (error) {
    // Make sure to clean up uploaded file if it wasn't unlinked yet
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {}
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
