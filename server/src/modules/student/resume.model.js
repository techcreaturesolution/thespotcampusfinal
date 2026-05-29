import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
    },
    punch_line: String,
    linkedin: String,
    github: String,
    education: String,
    skills: String,
    experience: String,
    projects: String,
    certificates: String,
    languages: String,
    interests: String,
  },
  { timestamps: true }
);

export default mongoose.model("tbl_resume", ResumeSchema);
