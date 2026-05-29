import tbl_application from "./application.model.js";
import tbl_student from "../student/student.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";

export const getAllApplications = async (req, res) => {
  try {
    const applications = await tbl_application
      .find({ job_id: req.params.id })
      .populate("student_id")
      .sort("-createdAt");
    res.status(StatusCodes.OK).json({ applications });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createApplication = async (req, res) => {
  try {
    req.body.student_id = req.user.userId;
    req.body.job_id = req.params.id;
    const application = await tbl_application.create(req.body);
    res.status(StatusCodes.CREATED).json({ application });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedApplication = await tbl_application.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );
    if (!updatedApplication) throw new NotFoundError(`No application with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Application updated", application: updatedApplication });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const removedApplication = await tbl_application.findByIdAndDelete(id);
    if (!removedApplication) throw new NotFoundError(`No application with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Application deleted", application: removedApplication });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getStudentApplications = async (req, res) => {
  try {
    const applications = await tbl_application
      .find({ student_id: req.user.userId })
      .populate("job_id")
      .sort("-createdAt");
    res.status(StatusCodes.OK).json({ applications });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
