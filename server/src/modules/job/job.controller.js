import tbl_jobpost from "./job.model.js";
import tbl_application from "../application/application.model.js";
import tbl_student from "../student/student.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import tbl_exam from "../exam/exam.model.js";
import tbl_payment from "../subscription/payment.model.js";
import tbl_branch from "../branch/branch.model.js";
import tbl_college from "../college/college.model.js";
import tbl_degree from "../degree/degree.model.js";
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
    let collegeId = null;

    if (req.user.role === "TPO") {
      const tpo = await tbl_tpo.findById(req.user.userId);
      if (tpo) {
        collegeId = tpo.tpo_college_id;
        if (tpo.tpo_degree_id) {
          query = {
            job_college: {
              $elemMatch: {
                job_college_id: collegeId,
                job_degree_id: tpo.tpo_degree_id,
              }
            }
          };
        } else {
          query = {
            "job_college.job_college_id": collegeId
          };
        }
      }
    } else if (req.user.role === "College") {
      // College sees all jobs targeted to their college or approved
      query = {
        $or: [
          { "job_college.job_college_id": req.user.userId },
          { approved_colleges: req.user.userId }
        ]
      };
    } else if (req.user.role === "University") {
      // University sees all jobs targeted to or approved by affiliated colleges
      const colleges = await tbl_college.find({ college_university_id: req.user.userId }).select("_id");
      const collegeIds = colleges.map((c) => c._id);
      query = {
        $or: [
          { "job_college.job_college_id": { $in: collegeIds } },
          { approved_colleges: { $in: collegeIds } }
        ]
      };
    }

    const jobs = await tbl_jobpost
      .find(query)
      .populate("job_company_id")
      .sort("-createdAt");

    const job_ids = jobs.map((j) => j._id);
    const exam = await tbl_exam.find({ job_id: { $in: job_ids } });

    res.status(StatusCodes.OK).json({ jobs, exam, collegeId });
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
    const job_id = Application.map((a) => a.job_id.toString());

    const jobs = await tbl_jobpost
      .find({
        ...queryObject,
        approved_colleges: student.college_id,
        job_status: "1", // Only retrieve active jobs
      })
      .populate("job_company_id")
      .populate("job_level")
      .sort(sortKey);

    const jobsWithAppliedStatus = jobs.map((job) => {
      const jobObj = job.toObject();
      jobObj.isApplied = job_id.includes(job._id.toString());
      return jobObj;
    });

    res.status(StatusCodes.OK).json({ totalJobs: jobs.length, jobs: jobsWithAppliedStatus });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createJob = async (req, res) => {
  try {
    req.body.job_company_id = req.user.userId;

    let jobcollegeData = [];
    if (req.body.approved_colleges && req.body.approved_colleges.length > 0 && req.body.target_degree) {
      const colleges = await tbl_college.find({ _id: { $in: req.body.approved_colleges } });
      const collegeMap = new Map(colleges.map((c) => [c._id.toString(), c]));

      const targetDegrees = Array.isArray(req.body.target_degree)
        ? req.body.target_degree
        : [req.body.target_degree];

      const degrees = await tbl_degree.find({
        degree_name: { $in: targetDegrees },
        college_id: { $in: req.body.approved_colleges },
      });

      const collegeDegreesMap = new Map();
      degrees.forEach((d) => {
        const cid = d.college_id.toString();
        if (!collegeDegreesMap.has(cid)) {
          collegeDegreesMap.set(cid, []);
        }
        collegeDegreesMap.get(cid).push(d);
      });

      jobcollegeData = [];
      req.body.approved_colleges.forEach((collegeId) => {
        const college = collegeMap.get(collegeId.toString());
        const matchingDegrees = collegeDegreesMap.get(collegeId.toString()) || [];

        if (matchingDegrees.length > 0) {
          matchingDegrees.forEach((degree) => {
            jobcollegeData.push({
              job_university_id: college?.college_university_id || null,
              job_college_id: collegeId,
              job_degree_id: degree._id,
            });
          });
        } else {
          jobcollegeData.push({
            job_university_id: college?.college_university_id || null,
            job_college_id: collegeId,
            job_degree_id: null,
          });
        }
      });
    } else if (req.body.jobEntries) {
      jobcollegeData = req.body.jobEntries.map((entry) => ({
        job_university_id: entry.job_university_id,
        job_college_id: entry.job_college_id,
        job_degree_id: entry.job_degree_id,
        job_branch_id: entry.job_branch_id,
      }));
    }

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

    const jobObj = job.toObject();

    // Check if current student has applied for this job
    if (req.user && req.user.role === "Student") {
      const alreadyApplied = await tbl_application.findOne({
        student_id: req.user.userId,
        job_id: id,
      });
      jobObj.isApplied = !!alreadyApplied;
    } else {
      jobObj.isApplied = false;
    }
    
    res.status(StatusCodes.OK).json({ job: jobObj });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.body.approved_colleges && req.body.approved_colleges.length > 0 && req.body.target_degree) {
      const colleges = await tbl_college.find({ _id: { $in: req.body.approved_colleges } });
      const collegeMap = new Map(colleges.map((c) => [c._id.toString(), c]));

      const targetDegrees = Array.isArray(req.body.target_degree)
        ? req.body.target_degree
        : [req.body.target_degree];

      const degrees = await tbl_degree.find({
        degree_name: { $in: targetDegrees },
        college_id: { $in: req.body.approved_colleges },
      });

      const collegeDegreesMap = new Map();
      degrees.forEach((d) => {
        const cid = d.college_id.toString();
        if (!collegeDegreesMap.has(cid)) {
          collegeDegreesMap.set(cid, []);
        }
        collegeDegreesMap.get(cid).push(d);
      });

      const jobcollegeData = [];
      req.body.approved_colleges.forEach((collegeId) => {
        const college = collegeMap.get(collegeId.toString());
        const matchingDegrees = collegeDegreesMap.get(collegeId.toString()) || [];

        if (matchingDegrees.length > 0) {
          matchingDegrees.forEach((degree) => {
            jobcollegeData.push({
              job_university_id: college?.college_university_id || null,
              job_college_id: collegeId,
              job_degree_id: degree._id,
            });
          });
        } else {
          jobcollegeData.push({
            job_university_id: college?.college_university_id || null,
            job_college_id: collegeId,
            job_degree_id: null,
          });
        }
      });
      req.body.job_college = jobcollegeData;
    } else if (req.body.jobEntries) {
      req.body.job_college = req.body.jobEntries.map((entry) => ({
        job_university_id: entry.job_university_id,
        job_college_id: entry.job_college_id,
        job_degree_id: entry.job_degree_id,
        job_branch_id: entry.job_branch_id,
      }));
    }

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

export const approveJobForCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const tpo = await tbl_tpo.findById(req.user.userId);
    if (!tpo) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Only TPOs can approve jobs" });
    }

    const collegeId = tpo.tpo_college_id;
    const job = await tbl_jobpost.findById(id);
    if (!job) {
      throw new NotFoundError(`No job with id: ${id}`);
    }

    if (job.job_status === "0") {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Cannot approve a deactivated job" });
    }

    if (approved) {
      if (!job.approved_colleges.includes(collegeId)) {
        job.approved_colleges.push(collegeId);
      }
    } else {
      job.approved_colleges = job.approved_colleges.filter(
        (cid) => cid.toString() !== collegeId.toString()
      );
    }

    await job.save();
    res.status(StatusCodes.OK).json({ msg: approved ? "Job approved for college" : "Job approval removed", job });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
