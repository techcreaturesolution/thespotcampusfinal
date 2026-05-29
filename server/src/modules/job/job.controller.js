import tbl_jobpost from "./job.model.js";
import tbl_application from "../application/application.model.js";
import tbl_student from "../student/student.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import tbl_exam from "../exam/exam.model.js";
import tbl_payment from "../subscription/payment.model.js";
import tbl_branch from "../branch/branch.model.js";
import tbl_college from "../college/college.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";

export const getAllJobs = async (req, res) => {
  try {
    const jobs = await tbl_jobpost
      .find({ job_company_id: req.user.userId })
      .populate("job_company_id")
      .populate("job_college.job_university_id")
      .populate("job_college.job_college_id")
      .populate("job_college.job_degree_id")
      .populate("job_college.job_branch_id")
      .sort("-createdAt");

    const job_id = jobs.map((j) => j._id);
    const exam = await tbl_exam.find({ job_id: { $in: job_id } });

    res.status(StatusCodes.OK).json({ jobs, exam });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getAllJobsClg = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "TPO") {
      const tpo = await tbl_tpo.findById(req.user.userId);
      query = { "job_college.job_college_id": tpo.tpo_college_id };
    } else if (req.user.role === "College") {
      query = { "job_college.job_college_id": req.user.userId };
    } else if (req.user.role === "University") {
      query = { "job_college.job_university_id": req.user.userId };
    }

    const jobs = await tbl_jobpost
      .find(query)
      .populate("job_company_id")
      .sort("-createdAt");

    res.status(StatusCodes.OK).json({ jobs });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    const { search, job_type, sort } = req.query;
    const queryObject = {};

    if (search) {
      queryObject.$or = [
        { job_position: { $regex: search, $options: "i" } },
        { job_title: { $regex: search, $options: "i" } },
      ];
    }
    if (job_type && job_type !== "all") {
      queryObject.job_type = job_type;
    }

    const sortOptions = {
      newest: "-createdAt",
      oldest: "createdAt",
      "a-z": "position",
      "z-a": "-position",
    };
    const sortKey = sortOptions[sort] || sortOptions.newest;

    const student = await tbl_student.findById(req.user.userId);
    const Application = await tbl_application.find({ student_id: req.user.userId });
    const job_id = Application.map((a) => a.job_id);

    const jobs = await tbl_jobpost
      .find({
        ...queryObject,
        "job_college.job_branch_id": student.branch_id,
        _id: { $nin: job_id },
      })
      .populate("job_company_id")
      .populate("job_level")
      .sort(sortKey);

    res.status(StatusCodes.OK).json({ totalJobs: jobs.length, jobs });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createJob = async (req, res) => {
  try {
    req.body.job_company_id = req.user.userId;

    const jobcollegeData = req.body.jobEntries
      ? req.body.jobEntries.map((entry) => ({
          job_university_id: entry.job_university_id,
          job_college_id: entry.job_college_id,
          job_degree_id: entry.job_degree_id,
          job_branch_id: entry.job_branch_id,
        }))
      : [];

    const joblevelData = req.body.joblevel
      ? req.body.joblevel.map((level) => ({
          level_type: level.level_type,
          level_name: level.level_name,
        }))
      : [];

    const job = await tbl_jobpost.create({
      ...req.body,
      job_college: jobcollegeData,
      job_level: joblevelData,
    });

    res.status(StatusCodes.CREATED).json({ job });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await tbl_jobpost
      .findById(id)
      .populate("job_company_id")
      .populate("job_college.job_university_id")
      .populate("job_college.job_college_id")
      .populate("job_college.job_degree_id")
      .populate("job_college.job_branch_id");

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
    res.status(StatusCodes.OK).json({ job });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedJob = await tbl_jobpost.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedJob) throw new NotFoundError(`No job with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Job modified", job: updatedJob });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const removedJob = await tbl_jobpost.findByIdAndDelete(id);
    if (!removedJob) throw new NotFoundError(`No job with id: ${id}`);

    await tbl_application.deleteMany({ job_id: id });
    await tbl_exam.deleteMany({ job_id: id });

    res.status(StatusCodes.OK).json({ msg: "Job deleted", job: removedJob });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
