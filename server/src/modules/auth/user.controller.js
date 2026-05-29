import tbl_admin from "./admin.model.js";
import { StatusCodes } from "http-status-codes";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await tbl_admin.findById(req.user.userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
    }
    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
