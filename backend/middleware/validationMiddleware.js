import mongoose from "mongoose";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";

const withValidationErrors = (validateValues) => {
  return async (req, res, next) => {
    try {
      await Promise.all(validateValues.map((v) => v.run(req)));
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid MongoDB ID: ${id}`);
  }
  next();
};

export const validateExamParam = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid exam ID: ${id}`);
  }
  next();
};

export const validatePaperParam = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid paper ID: ${id}`);
  }
  next();
};

export default withValidationErrors;
