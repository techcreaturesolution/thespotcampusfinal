import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    receiptId: { type: String, required: true },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
    },
    user_name: { type: String, required: true },
    user_enrollment: { type: String, required: true },
    user_email: { type: String, required: true },
    user_contact: { type: String, required: true },
    plan_name: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, default: "Created" },
    paymentId: { type: String },
    signature: { type: String },
    expires_at: { type: Date },
    is_active: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("tbl_payment", paymentSchema);
