import mongoose from "mongoose";
import { JOB_TYPE, STATUS, WORK_MODE } from "../utils/constants.js";

const JobSchema = new mongoose.Schema(
  {
    job_company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_company",
    },
    job_title: String,
    job_position: String,
    job_type: {
      type: String,
      enum: Object.values(JOB_TYPE),
      default: JOB_TYPE.FULL_TIME,
    },
    job_work_mode: {
      type: String,
      enum: Object.values(WORK_MODE),
      required: true,
    },
    job_location: {
      country: { type: String },
      state: { type: String },
      city: { type: String },
    },
    job_skills: String,
    job_reg_end_date: String,
    job_salary: String,
    job_exp: String,
    job_noofposition: String,
    job_desc: String,
    job_status: {
      type: String,
      default: STATUS.ACTIVE,
    },
    job_college: [
      {
        job_university_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "tbl_university",
        },
        job_college_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "tbl_college",
        },
        job_degree_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "tbl_degree",
        },
        job_branch_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "tbl_branch",
        },
      },
    ],
    job_level: [
      {
        level_type: String,
        level_name: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("tbl_jobpost", JobSchema);
