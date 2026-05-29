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
    const query = college_id ? { college_id } : {};
    const degrees = await tbl_degree.find(query, "degree_name degree_code degree_sem _id");
    res.status(StatusCodes.OK).json({ degrees });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getBranches = async (req, res) => {
  try {
    const { degree_id, college_id } = req.query;
    const query = {};
    if (degree_id) query.degree_id = degree_id;
    if (college_id) query.college_id = college_id;
    const branches = await tbl_branch.find(query, "branch_name branch_code _id");
    res.status(StatusCodes.OK).json({ branches });
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
