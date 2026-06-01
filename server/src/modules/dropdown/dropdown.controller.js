import tbl_university from "../university/university.model.js";
import tbl_college from "../college/college.model.js";
import tbl_degree from "../degree/degree.model.js";
import tbl_branch from "../branch/branch.model.js";
import tbl_degree_master from "../degree/degreemaster.model.js";
import { StatusCodes } from "http-status-codes";

export const getUniversities = async (req, res) => {
  try {
    const universities = await tbl_university.find({}, "university_name _id");
    res.status(StatusCodes.OK).json({ universities });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getColleges = async (req, res) => {
  try {
    const { university_id } = req.query;
    const query = university_id ? { college_university_id: university_id } : {};
    const colleges = await tbl_college.find(query, "college_name _id");
    res.status(StatusCodes.OK).json({ colleges });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getDegrees = async (req, res) => {
  try {
    const { college_id } = req.query;
    let degrees = await tbl_degree.find({}).populate("college_id");
    if (college_id) {
      degrees = degrees.filter(d => {
        if (!d.college_id) return true;
        return d.college_id._id.toString() === college_id.toString();
      });
    }
    // Map to return only required fields for dropdown
    const formattedDegrees = degrees.map(d => ({
      _id: d._id,
      degree_name: d.degree_name,
      degree_code: d.degree_code,
      degree_sem: d.degree_sem
    }));
    res.status(StatusCodes.OK).json({ degrees: formattedDegrees });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getBranches = async (req, res) => {
  try {
    const { degree_id, college_id } = req.query;
    const query = {};
    if (degree_id) query.degree_id = degree_id;
    
    let branches = await tbl_branch.find(query).populate("college_id");
    if (college_id) {
      branches = branches.filter(b => {
        if (!b.college_id) return true;
        return b.college_id._id.toString() === college_id.toString();
      });
    }
    const formattedBranches = branches.map(b => ({
      _id: b._id,
      branch_name: b.branch_name,
      branch_code: b.branch_code
    }));
    res.status(StatusCodes.OK).json({ branches: formattedBranches });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getDegreeMasters = async (req, res) => {
  try {
    const degreeMasters = await tbl_degree_master.find({});
    res.status(StatusCodes.OK).json({ degreeMasters });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
