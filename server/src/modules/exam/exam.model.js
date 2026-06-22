import mongoose from "mongoose";
import { EXAM_STATUS } from "../../utils/constants.js";

const ExamSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_company",
    },
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_jobpost",
    },
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    noOfQuestion: {
      type: Number,
      required: true,
    },
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
        options: [
          {
            optionText: {
              type: String,
              required: true,
            },
            isCorrect: {
              type: Boolean,
              required: true,
            },
          },
        ],
        questionType: {
          type: String,
          default: "single",
        },
        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "medium",
        },
      },
    ],
    timeLimit: {
      type: Number,
      required: true,
    },
    generatedFromJD: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(EXAM_STATUS),
      default: EXAM_STATUS.PUBLISHED,
    },
    // Proctoring settings
    proctoring: {
      enabled: {
        type: Boolean,
        default: true,
      },
      tabLockEnabled: {
        type: Boolean,
        default: true,
      },
      cameraEnabled: {
        type: Boolean,
        default: true,
      },
      cameraIntervalSeconds: {
        type: Number,
        default: 30,
      },
      maxViolations: {
        type: Number,
        default: 5,
      },
      autoSubmitOnMaxViolations: {
        type: Boolean,
        default: true,
      },
      fullScreenRequired: {
        type: Boolean,
        default: true,
      },
      copyPasteDisabled: {
        type: Boolean,
        default: true,
      },
      rightClickDisabled: {
        type: Boolean,
        default: true,
      },
      screenshotBlocked: {
        type: Boolean,
        default: true,
      },
    },
    passingScore: {
      type: Number,
      default: 0,
    },
    instructions: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("tbl_exam", ExamSchema);
