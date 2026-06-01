import tbl_college from "./college.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";
import { hashPassword } from "../../utils/passwordUtils.js";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

export const getAllColleges = async (req, res) => {
  try {
    const colleges = await tbl_college.find({}).populate("college_university_id").sort("-createdAt");
    res.status(StatusCodes.OK).json({ colleges });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createCollege = async (req, res) => {
  try {
    const hashedPassword = await hashPassword(req.body.college_password);
    req.body.college_password = hashedPassword;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      req.body.college_logo = response.secure_url;
      req.body.college_logoPublicID = response.public_id;
    }

    await tbl_college.create(req.body);
    res.status(StatusCodes.CREATED).json({ msg: "College created" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const college = await tbl_college.findById(id).populate("college_university_id");
    if (!college) throw new NotFoundError(`No college with id: ${id}`);
    res.status(StatusCodes.OK).json({ college });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const existingCollege = await tbl_college.findById(id);
    if (!existingCollege) throw new NotFoundError(`No college with id: ${id}`);

    let oldPublicId = existingCollege.college_logoPublicID;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      req.body.college_logo = response.secure_url;
      req.body.college_logoPublicID = response.public_id;
    }

    const updatedCollege = await tbl_college.findByIdAndUpdate(id, req.body, { new: true });

    if (req.file && oldPublicId) {
      await cloudinary.v2.uploader.destroy(oldPublicId);
    }

    res.status(StatusCodes.OK).json({ msg: "College modified", college: updatedCollege });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const removedCollege = await tbl_college.findByIdAndDelete(id);
    if (!removedCollege) throw new NotFoundError(`No college with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "College deleted", college: removedCollege });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.params;

    const updatedCollege = await tbl_college.findByIdAndUpdate(
      id,
      { college_verified: status },
      { new: true }
    );
    if (!updatedCollege) throw new NotFoundError(`No college with id: ${id}`);

    res.status(StatusCodes.OK).json({ msg: "College status modified", college: updatedCollege });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
