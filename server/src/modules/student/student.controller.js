import tbl_student from "./student.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";
import { hashPassword } from "../../utils/passwordUtils.js";
import { isEmailExists } from "../../utils/emailCheck.js";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

export const getAllStudents = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === "TPO") {
      const tpo = await tbl_tpo.findById(req.user.userId);
      if (tpo && tpo.tpo_college_id) {
        query.college_id = tpo.tpo_college_id;
        if (tpo.tpo_degree_id) {
          query.degree_id = tpo.tpo_degree_id;
        }
      } else {
        return res.status(StatusCodes.OK).json({ students: [] });
      }
    } else if (req.user && req.user.role === "College") {
      query.college_id = req.user.userId;
    } else if (req.user && req.user.role === "University") {
      query.university_id = req.user.userId;
    }

    const students = await tbl_student
      .find(query)
      .populate("college_id")
      .populate("university_id")
      .populate("degree_id")
      .populate("branch_id")
      .sort("-createdAt");
    res.status(StatusCodes.OK).json({ students });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createStudent = async (req, res) => {
  try {
    const emailConflict = await isEmailExists(req.body.student_email);
    if (emailConflict) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Email is already registered on this platform" });
    }

    const hashedPassword = await hashPassword(req.body.student_password);
    req.body.student_password = hashedPassword;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      req.body.student_image = response.secure_url;
      req.body.student_imagePublicID = response.public_id;
    }

    await tbl_student.create(req.body);
    res.status(StatusCodes.CREATED).json({ msg: "Student registered successfully" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await tbl_student
      .findById(id)
      .populate("college_id")
      .populate("university_id")
      .populate("degree_id")
      .populate("branch_id");

    if (!student) throw new NotFoundError(`No student with id: ${id}`);
    res.status(StatusCodes.OK).json({ student });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const existingStudent = await tbl_student.findById(id);
    if (!existingStudent) throw new NotFoundError(`No student with id: ${id}`);

    // Ownership check: Student can only update their own profile; Admin has full access
    if (req.user.role === "Student" && req.user.userId !== id) {
      return res.status(StatusCodes.FORBIDDEN).json({ error: "Access denied: cannot update another student's profile" });
    } else if (req.user.role !== "Student" && req.user.role !== "Admin") {
      // Institutional check if TPO or College
      if (req.user.role === "College" && existingStudent.college_id?.toString() !== req.user.userId) {
        return res.status(StatusCodes.FORBIDDEN).json({ error: "Access denied: student does not belong to your college" });
      }
      if (req.user.role === "TPO") {
        const tpo = await tbl_tpo.findById(req.user.userId);
        if (!tpo || existingStudent.college_id?.toString() !== tpo.tpo_college_id?.toString()) {
          return res.status(StatusCodes.FORBIDDEN).json({ error: "Access denied: student does not belong to your institution" });
        }
      } else if (req.user.role !== "College") {
        return res.status(StatusCodes.FORBIDDEN).json({ error: "Access denied" });
      }
    }

    // Explicit allowlist of editable student fields (prevents mass assignment & nested operator injection)
    const STUDENT_EDITABLE_FIELDS = [
      "student_name",
      "student_contact",
      "student_current_sem",
      "student_total_backlog",
      "student_skills",
      "student_enrollment",
      "college_id",
      "university_id",
      "degree_id",
      "branch_id",
    ];
    const updateData = {};
    for (const field of STUDENT_EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field) && req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    if (["Admin", "College", "TPO"].includes(req.user.role)) {
      if (req.body.isVerifiedByTPO !== undefined) updateData.isVerifiedByTPO = req.body.isVerifiedByTPO;
      if (req.body.student_status !== undefined) updateData.student_status = req.body.student_status;
    }

    let oldPublicId = existingStudent.student_imagePublicID;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      updateData.student_image = response.secure_url;
      updateData.student_imagePublicID = response.public_id;
    }

    const updatedStudent = await tbl_student.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    if (req.file && oldPublicId) {
      await cloudinary.v2.uploader.destroy(oldPublicId);
    }

    res.status(StatusCodes.OK).json({ msg: "Student modified", student: updatedStudent });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Ownership check: Student can only delete their own account; Admin has full access
    if (req.user.role === "Student" && req.user.userId !== id) {
      return res.status(StatusCodes.FORBIDDEN).json({ error: "Access denied: cannot delete another student's account" });
    } else if (req.user.role !== "Student" && req.user.role !== "Admin") {
      return res.status(StatusCodes.FORBIDDEN).json({ error: "Access denied" });
    }

    const removedStudent = await tbl_student.findByIdAndDelete(id);
    if (!removedStudent) throw new NotFoundError(`No student with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Student deleted", student: removedStudent });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const verifyStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerifiedByTPO } = req.body;

    const student = await tbl_student.findById(id);
    if (!student) throw new NotFoundError(`No student with id: ${id}`);

    if (!["TPO", "College"].includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "You are not allowed to verify students" });
    }

    // Security check: TPO can only verify their own college's students
    if (req.user.role === "TPO") {
      const tpo = await tbl_tpo.findById(req.user.userId);
      if (!tpo || !tpo.tpo_college_id || tpo.tpo_college_id.toString() !== student.college_id.toString()) {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "You can only verify students from your own college" });
      }
      if (tpo.tpo_degree_id && tpo.tpo_degree_id.toString() !== student.degree_id.toString()) {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "You can only verify students in your assigned degree program" });
      }
    }

    if (req.user.role === "College" && student.college_id.toString() !== req.user.userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "You can only verify students from your own college" });
    }

    student.isVerifiedByTPO = isVerifiedByTPO;
    await student.save();

    res.status(StatusCodes.OK).json({ msg: "Student verification status updated", student });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
