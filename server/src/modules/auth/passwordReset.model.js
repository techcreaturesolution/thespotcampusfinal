import mongoose from "mongoose";

const PasswordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Student", "Company", "College", "University", "TPO"],
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600, // Expires after 1 hour (TTL index)
    },
  },
  { timestamps: true }
);

export default mongoose.models.tbl_password_reset || mongoose.model("tbl_password_reset", PasswordResetSchema);
