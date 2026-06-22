import mongoose from "mongoose";

const PaperSchema = new mongoose.Schema(
  {
    exam_id: {
      type: String,
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
    },
    answers: [
      {
        question_id: {
          type: String,
          required: true,
        },
        selectedOption: [String],
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    // Proctoring data
    proctoring: {
      violations: [
        {
          type: {
            type: String,
            enum: [
              "tab_switch",
              "face_not_detected",
              "multiple_faces",
              "browser_resize",
              "copy_paste",
              "right_click",
              "screenshot_attempt",
              "devtools_open",
              "excessive_movement",
            ],
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          details: String,
        },
      ],
      cameraSnapshots: [
        {
          imageUrl: String,
          timestamp: {
            type: Date,
            default: Date.now,
          },
          faceDetected: {
            type: Boolean,
            default: true,
          },
          multipleFaces: {
            type: Boolean,
            default: false,
          },
        },
      ],
      totalViolations: {
        type: Number,
        default: 0,
      },
      trustScore: {
        type: Number,
        default: 100,
      },
      autoSubmitted: {
        type: Boolean,
        default: false,
      },
      autoSubmitReason: String,
      startedAt: Date,
      submittedAt: Date,
      totalTimeSpentSeconds: Number,
      browserInfo: String,
      ipAddress: String,
    },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "auto_submitted", "evaluated"],
      default: "in_progress",
    },
  },
  { timestamps: true },
);

export default mongoose.model("tbl_paper", PaperSchema);
