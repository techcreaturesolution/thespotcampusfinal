import tbl_branch from "../models/BranchModel.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../errors/customErrors.js";

export const getAllBranches = async (req, res) => {
  try {
    const branches = await tbl_branch.find({}).populate("degree_id").populate("college_id").sort("-createdAt");
    res.status(StatusCodes.OK).json({ branches });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const branch = await tbl_branch.create(req.body);
    res.status(StatusCodes.CREATED).json({ msg: "Branch created", branch });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await tbl_branch.findById(id).populate("degree_id").populate("college_id");
    if (!branch) throw new NotFoundError(`No branch with id: ${id}`);
    res.status(StatusCodes.OK).json({ branch });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBranch = await tbl_branch.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedBranch) throw new NotFoundError(`No branch with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Branch modified", branch: updatedBranch });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const removedBranch = await tbl_branch.findByIdAndDelete(id);
    if (!removedBranch) throw new NotFoundError(`No branch with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Branch deleted", branch: removedBranch });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
