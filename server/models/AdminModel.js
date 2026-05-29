import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    admin_name: String,
    admin_email: String,
    admin_password: String,
    role: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

AdminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.admin_password;
  return obj;
};

export default mongoose.model("tbl_admin", AdminSchema);
