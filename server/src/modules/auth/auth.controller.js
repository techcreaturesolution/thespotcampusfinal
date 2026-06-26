import { StatusCodes } from "http-status-codes";
import tbl_admin from "./admin.model.js";
import { hashPassword, comparePassword } from "../../utils/passwordUtils.js";
import { createJWT } from "../../utils/tokenUtils.js";

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

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(StatusCodes.OK).json({ msg: "Admin logged in", admin });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const logout = (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(StatusCodes.OK).json({ msg: "Admin logged out" });
};
