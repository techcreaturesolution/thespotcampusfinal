import tbl_degree_master from "../models/DegreeMasterModel.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../errors/customErrors.js";

export const getAllDegreeMasters = async (req, res) => {
  try {
    const degreeMasters = await tbl_degree_master.find({}).sort("-createdAt");
    res.status(StatusCodes.OK).json({ degreeMasters });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createDegreeMaster = async (req, res) => {
  try {
    const degreeMaster = await tbl_degree_master.create(req.body);
    res.status(StatusCodes.CREATED).json({ msg: "Degree Master created", degreeMaster });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getDegreeMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const degreeMaster = await tbl_degree_master.findById(id);
    if (!degreeMaster) throw new NotFoundError(`No degree master with id: ${id}`);
    res.status(StatusCodes.OK).json({ degreeMaster });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateDegreeMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDegreeMaster = await tbl_degree_master.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedDegreeMaster) throw new NotFoundError(`No degree master with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Degree Master modified", degreeMaster: updatedDegreeMaster });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteDegreeMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const removedDegreeMaster = await tbl_degree_master.findByIdAndDelete(id);
    if (!removedDegreeMaster) throw new NotFoundError(`No degree master with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Degree Master deleted", degreeMaster: removedDegreeMaster });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
