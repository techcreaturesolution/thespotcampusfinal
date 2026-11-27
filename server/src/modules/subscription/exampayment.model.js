import mongoose from "mongoose";

const AIPaymentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_company",
      required: true,
    },
    examId: {
      type: String,
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
    amount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
    },
    signature: {
      type: String,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      default: "Created",
    },
  },
  { timestamps: true },
);

AIPaymentSchema.index({ user_id: 1, examId: 1 });

export default mongoose.model("exam_payment", AIPaymentSchema);
