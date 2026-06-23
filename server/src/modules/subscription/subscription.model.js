import mongoose from "mongoose";

const RecruitmentPlanSchema = new mongoose.Schema(
  {
    plan_for: {
      type: String,
      enum: ["company", "student"],
      default: "company",
      required: true,
    },
    plan_name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    features: {
<<<<<<< Updated upstream
=======
<<<<<<< Updated upstream
      max_rounds_per_job: { type: Number, default: 5 },
      video_interview_enabled: { type: Boolean, default: true },
      max_interviews_per_month: { type: Number, default: 50 },
      advanced_analytics: { type: Boolean, default: false },
      priority_support: { type: Boolean, default: false },
=======
>>>>>>> Stashed changes
      max_rounds_per_job: {
        type: Number,
        default: 5,
      },
      video_interview_enabled: {
        type: Boolean,
        default: true,
      },
      max_interviews_per_month: {
        type: Number,
        default: 50,
      },
      advanced_analytics: {
        type: Boolean,
        default: false,
      },
      priority_support: {
        type: Boolean,
        default: false,
      },
<<<<<<< Updated upstream
=======
      cv_builder_enabled: {
        type: Boolean,
        default: true,
      },
      exam_preparation_enabled: {
        type: Boolean,
        default: true,
      },
>>>>>>> Stashed changes
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    validity_days: {
      type: Number,
      default: 30,
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
>>>>>>> Stashed changes
    },
  },
  { timestamps: true },
);

export const RecruitmentPlan = mongoose.model(
  "tbl_recruitment_plan",
  RecruitmentPlanSchema,
);

const RecruitmentSubscriptionSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_company",
      required: true,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_recruitment_plan",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    receiptId: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
    },
    signature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["Created", "Paid", "Failed", "Expired"],
      default: "Created",
    },
    starts_at: {
      type: Date,
    },
    expires_at: {
      type: Date,
    },
    is_active: {
      type: Boolean,
      default: false,
    },
    interviews_used: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const RecruitmentSubscription = mongoose.model(
  "tbl_recruitment_subscription",
  RecruitmentSubscriptionSchema,
);
