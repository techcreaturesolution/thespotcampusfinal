import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
    },
    punch_line: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    github: {
      type: String,
    },
    education: {
      type: String,
    },
    skills: {
      type: String,
    },
    experience: {
      type: String,
    },
    projects: {
      type: String,
    },
    certificates: {
      type: String,
    },
    languages: {
      type: String,
    },
    interests: {
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("tbl_resume", ResumeSchema);
