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

    let oldPublicId = existingStudent.student_imagePublicID;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      req.body.student_image = response.secure_url;
      req.body.student_imagePublicID = response.public_id;
    }

    const updatedStudent = await tbl_student.findByIdAndUpdate(id, req.body, { new: true });

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
