import { StatusCodes } from "http-status-codes";
import { profileCompletenessService } from "./profileCompleteness.service.js";

export const getMyProfileCompleteness = async (req, res) => {
  const data = await profileCompletenessService.getMyCompleteness(req.user);
  res.status(StatusCodes.OK).json(data);
};

export const getStudentProfileCompleteness = async (req, res) => {
  const data = await profileCompletenessService.getStudentCompleteness(
    req.user,
    req.params.studentId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const getProfileCompletenessRules = async (_req, res) => {
  const data = profileCompletenessService.getRulesMetadata();
  res.status(StatusCodes.OK).json(data);
};
