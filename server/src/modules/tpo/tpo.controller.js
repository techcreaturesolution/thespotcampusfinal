import tbl_tpo from "./tpo.model.js";
import tbl_college from "../college/college.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";
import { hashPassword } from "../../utils/passwordUtils.js";
import { isEmailExists } from "../../utils/emailCheck.js";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

export const getAllTPOs = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      if (req.user.role === "College") {
        query.tpo_college_id = req.user.userId;
      } else if (req.user.role === "University") {
        const colleges = await tbl_college.find({ college_university_id: req.user.userId }).select("_id");
        const collegeIds = colleges.map(c => c._id);
        query.tpo_college_id = { $in: collegeIds };
      }
    }
    const tpos = await tbl_tpo
      .find(query)
      .populate({
        path: "tpo_college_id",
        populate: {
          path: "college_university_id",
        },
      })
      .populate("tpo_degree_id")
      .sort("-createdAt");
    res.status(StatusCodes.OK).json({ tpos });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createTPO = async (req, res) => {
  try {
    const emailConflict = await isEmailExists(req.body.tpo_email);
    if (emailConflict) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Email is already registered on this platform" });
    }

    const hashedPassword = await hashPassword(req.body.tpo_password);
    req.body.tpo_password = hashedPassword;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      req.body.tpo_image = response.secure_url;
      req.body.tpo_imagePublicID = response.public_id;
    }

    await tbl_tpo.create(req.body);
    res.status(StatusCodes.CREATED).json({ msg: "TPO created" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getTPO = async (req, res) => {
  try {
    const { id } = req.params;
    const tpo = await tbl_tpo
      .findById(id)
      .populate({
        path: "tpo_college_id",
        populate: {
          path: "college_university_id",
        },
      })
      .populate("tpo_degree_id");
    if (!tpo) throw new NotFoundError(`No TPO with id: ${id}`);
    res.status(StatusCodes.OK).json({ tpo });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateTPO = async (req, res) => {
  try {
    const { id } = req.params;
    const existingTPO = await tbl_tpo.findById(id);
    if (!existingTPO) throw new NotFoundError(`No TPO with id: ${id}`);

    let oldPublicId = existingTPO.tpo_imagePublicID;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      req.body.tpo_image = response.secure_url;
      req.body.tpo_imagePublicID = response.public_id;
    }

    if (req.body.tpo_password) {
      req.body.tpo_password = await hashPassword(req.body.tpo_password);
    } else {
      delete req.body.tpo_password;
    }

    const updatedTPO = await tbl_tpo.findByIdAndUpdate(id, req.body, { new: true });

    if (req.file && oldPublicId) {
      await cloudinary.v2.uploader.destroy(oldPublicId);
    }

    res.status(StatusCodes.OK).json({ msg: "TPO modified", tpo: updatedTPO });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteTPO = async (req, res) => {
  try {
    const { id } = req.params;
    const removedTPO = await tbl_tpo.findByIdAndDelete(id);
    if (!removedTPO) throw new NotFoundError(`No TPO with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "TPO deleted", tpo: removedTPO });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
