import tbl_university from "./university.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";
import { hashPassword } from "../../utils/passwordUtils.js";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

export const getAllUniversitys = async (req, res) => {
  try {
    const universitys = await tbl_university.find({}).sort("-createdAt");
    res.status(StatusCodes.OK).json({ universitys });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createUniversity = async (req, res) => {
  try {
    const hashedPassword = await hashPassword(req.body.university_password);
    req.body.university_password = hashedPassword;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      req.body.university_logo = response.secure_url;
      req.body.university_logoPublicID = response.public_id;
    }

    await tbl_university.create(req.body);
    res.status(StatusCodes.CREATED).json({ msg: "University created" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const university = await tbl_university.findById(id);
    if (!university) throw new NotFoundError(`No university with id: ${id}`);
    res.status(StatusCodes.OK).json({ university });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const existingUniversity = await tbl_university.findById(id);
    if (!existingUniversity) throw new NotFoundError(`No university with id: ${id}`);

    let oldPublicId = existingUniversity.university_logoPublicID;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      req.body.university_logo = response.secure_url;
      req.body.university_logoPublicID = response.public_id;
    }

    const updatedUniversity = await tbl_university.findByIdAndUpdate(id, req.body, { new: true });

    if (req.file && oldPublicId) {
      await cloudinary.v2.uploader.destroy(oldPublicId);
    }

    res.status(StatusCodes.OK).json({ msg: "University modified", university: updatedUniversity });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const removedUniversity = await tbl_university.findByIdAndDelete(id);
    if (!removedUniversity) throw new NotFoundError(`No university with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "University deleted", university: removedUniversity });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
