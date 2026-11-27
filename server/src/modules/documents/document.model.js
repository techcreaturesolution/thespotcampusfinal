import mongoose from "mongoose";
import {
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  DOCUMENT_VISIBILITY,
} from "../../utils/constants.js";

const DocumentSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
      index: true,
    },
    document_type: {
      type: String,
      enum: Object.values(DOCUMENT_TYPES),
      default: DOCUMENT_TYPES.RESUME,
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    original_filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    storage_key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      unique: true,
    },
    storage_provider: {
      type: String,
      enum: ["local_private"],
      default: "local_private",
      required: true,
    },
    mime_type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    file_size: {
      type: Number,
      required: true,
      min: 1,
    },
    checksum: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    version: {
      type: Number,
      min: 1,
      default: 1,
    },
    malware_scan_status: {
      type: String,
      enum: ["NotScanned", "Clean", "Infected"],
      default: "NotScanned",
    },
    visibility: {
      type: String,
      enum: Object.values(DOCUMENT_VISIBILITY),
      default: DOCUMENT_VISIBILITY.PRIVATE,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.AVAILABLE,
      required: true,
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

DocumentSchema.index({ owner_id: 1, is_deleted: 1, document_type: 1, updatedAt: -1 });
DocumentSchema.index(
  { owner_id: 1, document_type: 1, checksum: 1 },
  { unique: true, partialFilterExpression: { is_deleted: false } },
);

export default mongoose.models.tbl_document ||
  mongoose.model("tbl_document", DocumentSchema);
