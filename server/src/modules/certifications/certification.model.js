import mongoose from "mongoose";
import {
  CERTIFICATION_CATEGORIES,
  CERTIFICATION_STATUS,
  CERTIFICATION_VISIBILITY,
} from "../../utils/constants.js";

const CertificateAttachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true, maxlength: 200 },
    original_name: { type: String, required: true, trim: true, maxlength: 200 },
    mime_type: { type: String, required: true, trim: true, maxlength: 100 },
    size_bytes: { type: Number, required: true, min: 1 },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const CertificationSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    normalized_title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    issuing_organization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    normalized_issuer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      enum: CERTIFICATION_CATEGORIES,
      default: "Technical",
      required: true,
    },
    credential_id: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    normalized_credential_id: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    credential_url: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    issue_date: {
      type: Date,
      required: true,
    },
    expiry_date: {
      type: Date,
      default: null,
    },
    does_not_expire: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    visibility: {
      type: String,
      enum: Object.values(CERTIFICATION_VISIBILITY),
      default: CERTIFICATION_VISIBILITY.PUBLIC,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CERTIFICATION_STATUS),
      default: CERTIFICATION_STATUS.ACTIVE,
      required: true,
    },
    certificate_file: {
      type: CertificateAttachmentSchema,
      default: null,
    },
    display_order: {
      type: Number,
      min: 0,
      default: 0,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    deleted_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    deleted_by_role: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

CertificationSchema.index({ student_id: 1, is_deleted: 1, display_order: 1, issue_date: -1 });
CertificationSchema.index({ student_id: 1, status: 1, is_deleted: 1 });
CertificationSchema.index({
  student_id: 1,
  normalized_issuer: 1,
  normalized_credential_id: 1,
  is_deleted: 1,
});

export default mongoose.models.tbl_certification ||
  mongoose.model("tbl_certification", CertificationSchema);
