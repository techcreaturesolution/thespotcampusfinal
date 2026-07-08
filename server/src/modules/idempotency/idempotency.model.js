import mongoose from "mongoose";

const IdempotencyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user_id: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["processing", "completed"],
      default: "processing",
    },
    response_status: {
      type: Number,
    },
    response_body: {
      type: mongoose.Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // Auto-delete after 24 hours
    },
  },
  { timestamps: true }
);

export default mongoose.models.tbl_idempotency_key || mongoose.model("tbl_idempotency_key", IdempotencyKeySchema);
