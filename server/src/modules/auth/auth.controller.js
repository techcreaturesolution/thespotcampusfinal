import { StatusCodes } from "http-status-codes";
import tbl_admin from "./admin.model.js";
import tbl_student from "../student/student.model.js";
import tbl_company from "../company/company.model.js";
import tbl_college from "../college/college.model.js";
import tbl_university from "../university/university.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import tbl_password_reset from "./passwordReset.model.js";
import { hashPassword, comparePassword } from "../../utils/passwordUtils.js";
import { createJWT } from "../../utils/tokenUtils.js";
import sendEmail, { sendPasswordResetEmail } from "../../utils/sendEmail.js";
import crypto from "crypto";

export const register = async (req, res) => {
  try {
    const hashedPassword = await hashPassword(req.body.admin_password);
    req.body.admin_password = hashedPassword;
    const admin = await tbl_admin.create(req.body);
    res
      .status(StatusCodes.CREATED)
      .json({ msg: "Admin registered successfully" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const admin = await tbl_admin.findOne({ admin_email: req.body.admin_email });
    if (!admin) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Invalid credentials" });
    }

    const isMatch = await comparePassword(
      req.body.admin_password,
      admin.admin_password
    );
    if (!isMatch) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Invalid credentials" });
    }

    const token = createJWT({ userId: admin._id, role: admin.role });
    const oneDay = 1000 * 60 * 60 * 24;

    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      partitioned: isSecure,
    });

    res.status(StatusCodes.OK).json({ msg: "Admin logged in", token, admin });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const logout = (req, res) => {
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";

  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    partitioned: isSecure,
  });
  res.status(StatusCodes.OK).json({ msg: "Admin logged out" });
};

// Helper function to find user across collections
const findUserByEmail = async (email) => {
  if (!email) return null;
  const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const emailRegex = new RegExp(`^${escapedEmail}$`, "i");

  let user = await tbl_admin.findOne({ admin_email: emailRegex });
  if (user) return { user, role: "Admin", emailField: "admin_email", passwordField: "admin_password" };

  user = await tbl_student.findOne({ student_email: emailRegex });
  if (user) return { user, role: "Student", emailField: "student_email", passwordField: "student_password" };

  user = await tbl_company.findOne({ company_email: emailRegex });
  if (user) return { user, role: "Company", emailField: "company_email", passwordField: "company_password" };

  user = await tbl_college.findOne({ college_email: emailRegex });
  if (user) return { user, role: "College", emailField: "college_email", passwordField: "college_password" };

  user = await tbl_university.findOne({ university_email: emailRegex });
  if (user) return { user, role: "University", emailField: "university_email", passwordField: "university_password" };

  user = await tbl_tpo.findOne({ tpo_email: emailRegex });
  if (user) return { user, role: "TPO", emailField: "tpo_email", passwordField: "tpo_password" };

  return null;
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please provide an email address" });
    }

    const account = await findUserByEmail(email);

    // Return a generic success message even if email doesn't exist (mitigates email harvesting)
    if (!account) {
      return res.status(StatusCodes.OK).json({
        msg: "If an account is associated with this email, a password reset link has been sent."
      });
    }

    // 1. Generate random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Hash token for database storage (SHA-256)
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // 3. Store/Upsert in tbl_password_reset
    await tbl_password_reset.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        email: email.toLowerCase(),
        role: account.role,
        token: hashedToken,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // 4. Construct Reset URL
    const origin = req.headers.origin || process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173";
    const resetUrl = `${origin}/reset-password/${resetToken}`;

    // 5. Send email
    await sendPasswordResetEmail(email, resetUrl);

    res.status(StatusCodes.OK).json({
      msg: "If an account is associated with this email, a password reset link has been sent."
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Token and password are required" });
    }

    if (password.length < 6) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Password must be at least 6 characters long" });
    }

    // 1. Hash incoming token to match database SHA-256
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Query tbl_password_reset
    const resetRecord = await tbl_password_reset.findOne({ token: hashedToken });
    if (!resetRecord) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid or expired password reset token." });
    }

    // 3. Find the user account
    const account = await findUserByEmail(resetRecord.email);
    if (!account) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User account not found." });
    }

    // 4. Update the password
    const hashedPassword = await hashPassword(password);
    account.user[account.passwordField] = hashedPassword;
    await account.user.save();

    // 5. Delete the reset token record
    await tbl_password_reset.deleteOne({ _id: resetRecord._id });

    res.status(StatusCodes.OK).json({ msg: "Password has been successfully updated. You can now login." });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

