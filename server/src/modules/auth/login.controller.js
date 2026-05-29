import { StatusCodes } from "http-status-codes";
import tbl_student from "../student/student.model.js";
import tbl_company from "../company/company.model.js";
import tbl_college from "../college/college.model.js";
import tbl_university from "../university/university.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import { comparePassword } from "../../utils/passwordUtils.js";
import { createJWT } from "../../utils/tokenUtils.js";

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    let user;

    switch (role) {
      case "Student":
        user = await tbl_student
          .findOne({ student_email: email })
          .select("+student_password");
        if (user) {
          const isMatch = await comparePassword(password, user.student_password);
          if (!isMatch) {
            return res
              .status(StatusCodes.UNAUTHORIZED)
              .json({ msg: "Invalid credentials" });
          }
        }
        break;
      case "Company":
        user = await tbl_company
          .findOne({ company_email: email })
          .select("+company_password");
        if (user) {
          const isMatch = await comparePassword(password, user.company_password);
          if (!isMatch) {
            return res
              .status(StatusCodes.UNAUTHORIZED)
              .json({ msg: "Invalid credentials" });
          }
        }
        break;
      case "College":
        user = await tbl_college
          .findOne({ college_email: email })
          .select("+college_password");
        if (user) {
          const isMatch = await comparePassword(password, user.college_password);
          if (!isMatch) {
            return res
              .status(StatusCodes.UNAUTHORIZED)
              .json({ msg: "Invalid credentials" });
          }
        }
        break;
      case "University":
        user = await tbl_university
          .findOne({ university_email: email })
          .select("+university_password");
        if (user) {
          const isMatch = await comparePassword(
            password,
            user.university_password
          );
          if (!isMatch) {
            return res
              .status(StatusCodes.UNAUTHORIZED)
              .json({ msg: "Invalid credentials" });
          }
        }
        break;
      case "TPO":
        user = await tbl_tpo
          .findOne({ tpo_email: email })
          .select("+tpo_password");
        if (user) {
          const isMatch = await comparePassword(password, user.tpo_password);
          if (!isMatch) {
            return res
              .status(StatusCodes.UNAUTHORIZED)
              .json({ msg: "Invalid credentials" });
          }
        }
        break;
      default:
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: "Invalid role" });
    }

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Invalid credentials" });
    }

    const token = createJWT({ userId: user._id, role: user.role });
    const oneDay = 1000 * 60 * 60 * 24;

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: process.env.NODE_ENV === "production",
    });

    res.status(StatusCodes.OK).json({ msg: "Login successful", user });
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
