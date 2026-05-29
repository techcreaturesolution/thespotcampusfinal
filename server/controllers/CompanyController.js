import tbl_company from "../models/CompanyModel.js";
import tbl_job from "../models/JobModel.js";
import tbl_application from "../models/ApplicationModel.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../errors/customErrors.js";
import { hashPassword } from "../utils/passwordUtils.js";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

export const getAllCompanys = async (req, res) => {
  try {
    const companys = await tbl_company.find({}).sort("-createdAt");
    res.status(StatusCodes.OK).json({ companys });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const hashedPassword = await hashPassword(req.body.company_password);
    req.body.company_password = hashedPassword;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      req.body.company_logo = response.secure_url;
      req.body.company_logoPublicID = response.public_id;
    }

    await tbl_company.create(req.body);
    res.status(StatusCodes.CREATED).json({ msg: "Company created" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await tbl_company.findById(id);
    if (!company) throw new NotFoundError(`No company with id : ${id}`);
    res.status(StatusCodes.OK).json({ company });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const existingCompany = await tbl_company.findById(id);
    if (!existingCompany) throw new NotFoundError(`No company with id: ${id}`);

    let oldPublicId = existingCompany.company_logoPublicID;

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      req.body.company_logo = response.secure_url;
      req.body.company_logoPublicID = response.public_id;
    }

    const updatedCompany = await tbl_company.findByIdAndUpdate(id, req.body, { new: true });

    if (req.file && oldPublicId) {
      await cloudinary.v2.uploader.destroy(oldPublicId);
    }

    res.status(StatusCodes.OK).json({ msg: "Company modified", company: updatedCompany });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const removedCompany = await tbl_company.findByIdAndDelete(id);
    if (!removedCompany) throw new NotFoundError(`No company with id : ${id}`);

    const jobs = await tbl_job.find({ job_company_id: id });
    const jobIds = jobs.map((job) => job._id);

    if (jobIds.length > 0) {
      await tbl_application.deleteMany({ job_id: { $in: jobIds } });
    }
    await tbl_job.deleteMany({ job_company_id: id });

    res.status(StatusCodes.OK).json({ msg: "Company and associated data deleted", company: removedCompany });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.params;

    const updatedCompany = await tbl_company.findByIdAndUpdate(
      id,
      { company_verified: status },
      { new: true }
    );
    if (!updatedCompany) throw new NotFoundError(`No company with id: ${id}`);

    res.status(StatusCodes.OK).json({ msg: "Company status modified", company: updatedCompany });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
