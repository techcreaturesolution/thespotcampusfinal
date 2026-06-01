import { StatusCodes } from "http-status-codes";
import tbl_student from "../student/student.model.js";
import tbl_company from "../company/company.model.js";
import tbl_college from "../college/college.model.js";
import tbl_university from "../university/university.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import tbl_admin from "./admin.model.js";
import { comparePassword } from "../../utils/passwordUtils.js";
import { createJWT } from "../../utils/tokenUtils.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = null;
    let detectedRole = "";
    let userPassword = "";

    // 0. Search in Admin
    user = await tbl_admin.findOne({ admin_email: email }).select("+admin_password");
    if (user) {
      detectedRole = "Admin";
      userPassword = user.admin_password;
    }

    // 1. Search in Student
    if (!user) {
      user = await tbl_student.findOne({ student_email: email }).select("+student_password");
      if (user) {
        detectedRole = "Student";
        userPassword = user.student_password;
      }
    }

    // 2. Search in Company
    if (!user) {
      user = await tbl_company.findOne({ company_email: email }).select("+company_password");
      if (user) {
        detectedRole = "Company";
        userPassword = user.company_password;
      }
    }

    // 3. Search in College
    if (!user) {
      user = await tbl_college.findOne({ college_email: email }).select("+college_password");
      if (user) {
        detectedRole = "College";
        userPassword = user.college_password;
      }
    }

    // 4. Search in University
    if (!user) {
      user = await tbl_university.findOne({ university_email: email }).select("+university_password");
      if (user) {
        detectedRole = "University";
        userPassword = user.university_password;
      }
    }

    // 5. Search in TPO
    if (!user) {
      user = await tbl_tpo.findOne({ tpo_email: email }).select("+tpo_password");
      if (user) {
        detectedRole = "TPO";
        userPassword = user.tpo_password;
      }
    }

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Invalid credentials" });
    }

    const isMatch = await comparePassword(password, userPassword);
    if (!isMatch) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Invalid credentials" });
    }

    const token = createJWT({ userId: user._id, role: detectedRole });
    const oneDay = 1000 * 60 * 60 * 24;

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: process.env.NODE_ENV === "production",
    });

    res.status(StatusCodes.OK).json({ msg: "Login successful", user, role: detectedRole });
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
  });
  res.status(StatusCodes.OK).json({ msg: "User logged out" });
};

export const getCurrentUser = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let user;

    switch (role) {
      case "Admin":
        user = await tbl_admin.findById(userId);
        break;
      case "Student":
        user = await tbl_student.findById(userId);
        break;
      case "Company":
        user = await tbl_company.findById(userId);
        break;
      case "College":
        user = await tbl_college.findById(userId);
        break;
      case "University":
        user = await tbl_university.findById(userId);
        break;
      case "TPO":
        user = await tbl_tpo.findById(userId);
        break;
      default:
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: "Invalid role" });
    }

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "User not found" });
    }

    res.status(StatusCodes.OK).json({ user, role });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};
