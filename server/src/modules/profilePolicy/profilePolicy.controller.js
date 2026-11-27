import { StatusCodes } from "http-status-codes";
import { profilePolicyService } from "./profilePolicy.service.js";

const getReqMeta = (req) => ({
  ip: req.ip || "",
  userAgent: req.get("user-agent") || "",
});

export const getPolicyMetadata = async (_req, res) => {
  res.status(StatusCodes.OK).json(profilePolicyService.getPolicyMetadata());
};

export const getMyPolicyStatus = async (req, res) => {
  const data = await profilePolicyService.getMyPolicyStatus(req.user);
  res.status(StatusCodes.OK).json(data);
};

export const publishMyProfile = async (req, res) => {
  const data = await profilePolicyService.publishMyProfile(req.user, req.body, getReqMeta(req));
  res.status(StatusCodes.OK).json({
    msg: "Profile published successfully",
    ...data,
  });
};

export const unpublishMyProfile = async (req, res) => {
  const data = await profilePolicyService.unpublishMyProfile(req.user, getReqMeta(req));
  res.status(StatusCodes.OK).json({
    msg: "Profile set to Private and unpublished",
    ...data,
  });
};

export const updateMyVisibility = async (req, res) => {
  const data = await profilePolicyService.updateMyVisibility(req.user, req.body, getReqMeta(req));
  res.status(StatusCodes.OK).json({
    msg: "Profile visibility updated successfully",
    ...data,
  });
};

export const getStudentPolicyStatus = async (req, res) => {
  const data = await profilePolicyService.getStudentPolicyStatus(req.user, req.params.studentId);
  res.status(StatusCodes.OK).json(data);
};

export const adminOverrideStudentVisibility = async (req, res) => {
  const data = await profilePolicyService.adminOverrideStudentVisibility(
    req.user,
    req.params.studentId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Administrator visibility override updated",
    ...data,
  });
};

export const viewProfileWithPolicy = async (req, res) => {
  const previewAudience = req.query?.preview ? String(req.query.preview) : null;
  const data = await profilePolicyService.viewProfileWithPolicy(req.user, req.params.studentId, {
    previewAudience,
  });
  res.status(StatusCodes.OK).json(data);
};

export const getPublicProfile = async (req, res) => {
  const data = await profilePolicyService.viewProfileWithPolicy(null, req.params.studentId);
  res.status(StatusCodes.OK).json(data);
};

export const discoverPublicProfiles = async (req, res) => {
  const data = await profilePolicyService.discoverPublicProfiles(req.query);
  res.status(StatusCodes.OK).json(data);
};
