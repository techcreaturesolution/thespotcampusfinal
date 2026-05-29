import tbl_degree from "../models/DegreeModel.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../errors/customErrors.js";

export const getAllDegrees = async (req, res) => {
  try {
    const degrees = await tbl_degree.find({}).populate("college_id").sort("-createdAt");
    res.status(StatusCodes.OK).json({ degrees });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createDegree = async (req, res) => {
  try {
    const degree = await tbl_degree.create(req.body);
    res.status(StatusCodes.CREATED).json({ msg: "Degree created", degree });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getDegree = async (req, res) => {
  try {
    const { id } = req.params;
    const degree = await tbl_degree.findById(id).populate("college_id");
    if (!degree) throw new NotFoundError(`No degree with id: ${id}`);
    res.status(StatusCodes.OK).json({ degree });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateDegree = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDegree = await tbl_degree.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedDegree) throw new NotFoundError(`No degree with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Degree modified", degree: updatedDegree });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteDegree = async (req, res) => {
  try {
    const { id } = req.params;
    const removedDegree = await tbl_degree.findByIdAndDelete(id);
    if (!removedDegree) throw new NotFoundError(`No degree with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Degree deleted", degree: removedDegree });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
