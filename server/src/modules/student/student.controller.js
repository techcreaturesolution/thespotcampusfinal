import tbl_student from "./student.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError, UnauthorizedError } from "../../errors/customErrors.js";
import { hashPassword } from "../../utils/passwordUtils.js";
import { isEmailExists } from "../../utils/emailCheck.js";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

const canAccessStudentRecord = async (reqUser, student) => {
  if (!reqUser) return false;
  if (reqUser.role === "Admin") return true;
  if (reqUser.role === "Student") {
    return student._id.toString() === reqUser.userId;
  }
  if (reqUser.role === "College") {
    return Boolean(student.college_id && student.college_id._id?.toString?.() === reqUser.userId || student.college_id?.toString() === reqUser.userId);
  }
  if (reqUser.role === "University") {
    return Boolean(student.university_id && student.university_id._id?.toString?.() === reqUser.userId || student.university_id?.toString() === reqUser.userId);
  }
  if (reqUser.role === "TPO") {
    const tpo = await tbl_tpo.findById(reqUser.userId);
    if (!tpo || !tpo.tpo_college_id) return false;
    const studentCollegeId = student.college_id?._id?.toString() || student.college_id?.toString();
    if (tpo.tpo_college_id.toString() !== studentCollegeId) return false;
    if (tpo.tpo_degree_id) {
      const studentDegreeId = student.degree_id?._id?.toString() || student.degree_id?.toString();
      return tpo.tpo_degree_id.toString() === studentDegreeId;
    }
    return true;
  }
  return false;
};

export const getAllStudents = async (req, res) => {
  try {
    if (!req.user || !["Admin", "University", "College", "TPO"].includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Unauthorized to list students" });
    }

    let query = { is_deleted: { $ne: true } };
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
    const {
      college_id,
      university_id,
      degree_id,
      branch_id,
      student_enrollment,
      student_name,
      student_email,
      student_contact,
      student_current_sem,
      student_total_backlog,
      student_skills,
      academic_year,
      academic_batch,
    } = req.body;

    const studentPayload = {
      college_id,
      university_id,
      degree_id,
      branch_id,
      student_enrollment,
      student_name,
      student_email,
      student_contact,
      student_current_sem,
      student_total_backlog: student_total_backlog || "0",
      student_skills,
      academic_year,
      academic_batch,
      student_password: hashedPassword,
      isVerifiedByTPO: false,
      role: "Student",
    };

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      studentPayload.student_image = response.secure_url;
      studentPayload.student_imagePublicID = response.public_id;
    }

    await tbl_student.create(studentPayload);
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

    if (!student || student.is_deleted) throw new NotFoundError(`No student with id: ${id}`);
    const allowed = await canAccessStudentRecord(req.user, student);
    if (!allowed) {
      throw new UnauthorizedError("Unauthorized to access this student record");
    }
    res.status(StatusCodes.OK).json({ student });
  } catch (error) {
    const status = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(status).json({ msg: error.message, error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const existingStudent = await tbl_student.findById(id);
    if (!existingStudent || existingStudent.is_deleted) throw new NotFoundError(`No student with id: ${id}`);

    if (!req.user || !["Admin", "College", "TPO", "Student"].includes(req.user.role)) {
      throw new UnauthorizedError("Unauthorized to update student record");
    }
    const allowed = await canAccessStudentRecord(req.user, existingStudent);
    if (!allowed) {
      throw new UnauthorizedError("Unauthorized to update this student record");
    }

    const allowedFields =
      req.user.role === "Student"
        ? ["student_name", "student_contact", "student_skills"]
        : ["student_name", "student_contact", "student_skills", "student_status"];

    const safeUpdate = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        safeUpdate[key] = req.body[key];
      }
    }

    let oldPublicId = existingStudent.student_imagePublicID;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      safeUpdate.student_image = response.secure_url;
      safeUpdate.student_imagePublicID = response.public_id;
    }

    const updatedStudent = await tbl_student.findByIdAndUpdate(id, { $set: safeUpdate }, { new: true });

    if (req.file && oldPublicId) {
      await cloudinary.v2.uploader.destroy(oldPublicId);
    }

    res.status(StatusCodes.OK).json({ msg: "Student modified", student: updatedStudent });
  } catch (error) {
    const status = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(status).json({ msg: error.message, error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user || !["Admin", "College", "TPO", "University"].includes(req.user.role)) {
      throw new UnauthorizedError("Unauthorized to delete student record");
    }
    const existingStudent = await tbl_student.findById(id);
    if (!existingStudent) throw new NotFoundError(`No student with id: ${id}`);

    const allowed = await canAccessStudentRecord(req.user, existingStudent);
    if (!allowed) {
      throw new UnauthorizedError("Unauthorized to delete this student record");
    }

    const removedStudent = await tbl_student.findByIdAndDelete(id);
    res.status(StatusCodes.OK).json({ msg: "Student deleted", student: removedStudent });
  } catch (error) {
    const status = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(status).json({ msg: error.message, error: error.message });
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
