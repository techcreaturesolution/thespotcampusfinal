import tbl_branch from "./branch.model.js";
import tbl_college from "../college/college.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";

export const getAllBranches = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      if (req.user.role === "College") {
        query.college_id = req.user.userId;
      } else if (req.user.role === "TPO") {
        const tpo = await tbl_tpo.findById(req.user.userId);
        if (tpo && tpo.tpo_college_id) {
          query.college_id = tpo.tpo_college_id;
        } else {
          return res.status(StatusCodes.OK).json({ branches: [] });
        }
      } else if (req.user.role === "University") {
        const colleges = await tbl_college.find({ college_university_id: req.user.userId }).select("_id");
        const collegeIds = colleges.map(c => c._id);
        query.college_id = { $in: collegeIds };
      }
    }
    const branches = await tbl_branch.find(query).populate("degree_id").populate("college_id").sort("-createdAt");
    res.status(StatusCodes.OK).json({ branches });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    if (req.user && req.user.role === "College") {
      req.body.college_id = req.user.userId;
    }
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
