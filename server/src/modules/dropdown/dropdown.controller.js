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

export const getUniqueDegrees = async (req, res) => {
  try {
    const degrees = await tbl_degree.distinct("degree_name");
    res.status(StatusCodes.OK).json({ degrees: degrees.filter(Boolean) });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getCollegesByDegree = async (req, res) => {
  try {
    const { degree_name } = req.query;
    if (!degree_name) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "degree_name query parameter is required" });
    }
    
    // Support both single degree_name and comma-separated degrees
    const degreeNames = degree_name.split(",").map((d) => d.trim()).filter(Boolean);

    const degreeEntries = await tbl_degree.find({
      degree_name: { $in: degreeNames }
    }).populate("college_id");

    const collegesMap = new Map();
    degreeEntries.forEach((entry) => {
      if (entry.college_id && entry.college_id.college_status !== "0") {
        collegesMap.set(entry.college_id._id.toString(), {
          _id: entry.college_id._id,
          college_name: entry.college_id.college_name,
          college_code: entry.college_id.college_code,
        });
      }
    });
    const colleges = Array.from(collegesMap.values());
    res.status(StatusCodes.OK).json({ colleges });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
