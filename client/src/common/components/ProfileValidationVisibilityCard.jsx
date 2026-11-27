import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiGlobe,
  FiHome,
  FiLock,
  FiEye,
  FiRefreshCw,
  FiArrowRight,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const VISIBILITY_OPTIONS = [
  {
    value: "Private",
    label: "Private",
    subtitle: "Only you & admins",
    icon: FiLock,
  },
  {
    value: "Institute Only",
    label: "Institute Only",
    subtitle: "Your institute faculty & TPO",
    icon: FiHome,
  },
  {
    value: "Public",
    label: "Public",
    subtitle: "Discoverable public allowlist",
    icon: FiGlobe,
  },
];

const STATE_BADGE_MAP = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  VALID: "bg-indigo-50 text-[#3730a3] border-indigo-200",
  INVALID: "bg-rose-50 text-rose-700 border-rose-200",
  SUSPENDED: "bg-rose-100 text-rose-800 border-rose-300",
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
};

const ProfileValidationVisibilityCard = ({
  studentId = null,
  role = "Student",
  refreshKey = 0,
  onPolicyUpdated = null,
}) => {
  const isSelfStudent = !studentId && role === "Student";
  const isAdminStaff = Boolean(studentId) && role === "Admin";

  const [policyData, setPolicyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmPublicTarget, setConfirmPublicTarget] = useState(false);

  const [previewAudience, setPreviewAudience] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [overrideState, setOverrideState] = useState("NONE");
  const [overrideReason, setOverrideReason] = useState("");

  const endpoint = isSelfStudent ? "/profile-policy/me" : `/profile-policy/student/${studentId}`;

  const fetchPolicy = useCallback(async () => {
    if (!isSelfStudent && !studentId) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { data } = await customFetch.get(endpoint);
      setPolicyData(data);
      setOverrideState(data?.visibility?.visibility_override || "NONE");
      setOverrideReason(data?.visibility?.visibility_override_reason || "");
    } catch (error) {
      setErrorMsg(error?.response?.data?.msg || "Failed to load profile validation & visibility");
    } finally {
      setLoading(false);
    }
  }, [endpoint, isSelfStudent, studentId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy, refreshKey]);

  const handleVisibilityAction = async (targetVisibility) => {
    if (targetVisibility === "Public" && !confirmPublicTarget) {
      setConfirmPublicTarget(true);
      return;
    }

    setMutating(true);
    setConfirmPublicTarget(false);
    try {
      let response;
      if (targetVisibility === "Private") {
        response = await customFetch.post("/profile-policy/me/unpublish");
      } else if (!policyData?.visibility?.is_published) {
        response = await customFetch.post("/profile-policy/me/publish", {
          visibility: targetVisibility,
        });
      } else {
        response = await customFetch.patch("/profile-policy/me/visibility", {
          visibility: targetVisibility,
        });
      }

      setPolicyData(response.data);
      toast.success(response.data?.msg || `Visibility set to ${targetVisibility}`);
      if (onPolicyUpdated) onPolicyUpdated(response.data);
    } catch (error) {
      const msg = error?.response?.data?.msg || "Unable to update visibility";
      toast.error(msg);
      if (error?.response?.data?.details) {
        setPolicyData((prev) =>
          prev ? { ...prev, validation: error.response.data.details } : prev,
        );
      }
    } finally {
      setMutating(false);
    }
  };

  const handleLoadPreview = async (audience) => {
    const targetId = studentId || policyData?.student_id;
    if (!targetId) return;
    if (previewAudience === audience && previewData) {
      setPreviewAudience("");
      setPreviewData(null);
      return;
    }

    setPreviewAudience(audience);
    setPreviewLoading(true);
    try {
      const { data } = await customFetch.get(
        `/profile-policy/view/${targetId}?preview=${audience}`,
      );
      setPreviewData(data);
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to load audience preview");
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAdminOverride = async (e) => {
    e.preventDefault();
    if (!isAdminStaff) return;
    setMutating(true);
    try {
      const { data } = await customFetch.patch(`/profile-policy/admin/${studentId}/override`, {
        visibility_override: overrideState,
        reason: overrideReason,
      });
      setPolicyData(data);
      toast.success(data?.msg || "Override updated");
      if (onPolicyUpdated) onPolicyUpdated(data);
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to apply override");
    } finally {
      setMutating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse">
        <div className="h-4 w-56 bg-slate-200 rounded mb-3" />
        <div className="h-20 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-slate-800">Policy Status Unavailable</h4>
            <p className="text-xs text-slate-500 mt-0.5">{errorMsg}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchPolicy}
          className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!policyData) return null;

  const { validation, visibility } = policyData;
  const currentVisibility = visibility?.profile_visibility || "Private";
  const isPublished = Boolean(visibility?.is_published);
  const isPublishable = Boolean(validation?.publishable);
  const errors = validation?.errors || [];
  const warnings = validation?.warnings || [];
  const stateBadgeClass =
    STATE_BADGE_MAP[validation?.profile_state] || STATE_BADGE_MAP.DRAFT;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#3730a3] flex items-center justify-center shrink-0">
            <FiShield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Validation &amp; Visibility Policy
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${stateBadgeClass}`}
              >
                {validation?.profile_state || "DRAFT"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border bg-slate-50 text-slate-700 border-slate-200">
                {currentVisibility}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {validation?.valid ? "All required domain rules pass." : `${errors.length} blocking issue(s) must be fixed.`}{" "}
              • {isPublishable ? "Publishable" : "Not publishable yet"}{" "}
              • {isPublished ? "Published" : "Unpublished"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchPolicy}
          disabled={loading || mutating}
          className="self-start sm:self-center p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-[#3730a3] hover:bg-indigo-50/50 transition-colors"
          title="Re-evaluate validation & visibility"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {visibility?.requires_republish_review && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
          <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This profile was previously published, but currently fails required validation rules.
            External public discovery is automatically blocked until blocking errors are fixed.
          </span>
        </div>
      )}

      {visibility?.visibility_override && visibility.visibility_override !== "NONE" && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
          <FiLock className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Administrator Override Active: <strong>{visibility.visibility_override}</strong>
            {visibility.visibility_override_reason
              ? ` — ${visibility.visibility_override_reason}`
              : ""}
          </span>
        </div>
      )}

      {/* Visibility Selector (Student owner only) */}
      {isSelfStudent && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Audience &amp; Publish Control
            </h4>
            {isPublished && (
              <button
                type="button"
                disabled={mutating}
                onClick={() => handleVisibilityAction("Private")}
                className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50"
              >
                Unpublish (Set Private)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {VISIBILITY_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = currentVisibility === opt.value;
              const blockedByValidation = opt.value !== "Private" && !isPublishable;
              const blockedByOverride =
                opt.value !== "Private" && visibility?.visibility_override !== "NONE";
              const isDisabled = mutating || blockedByValidation || blockedByOverride;

              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleVisibilityAction(opt.value)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? "bg-indigo-50/70 border-[#3730a3] ring-1 ring-[#3730a3]/20"
                      : "bg-slate-50/60 border-slate-200 hover:border-indigo-300"
                  } ${isDisabled && !isSelected ? "opacity-55 cursor-not-allowed" : ""}`}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isSelected ? "text-[#3730a3]" : "text-slate-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{opt.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {confirmPublicTarget && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2.5">
              <p className="text-xs font-semibold text-indigo-950">
                Confirm Public Visibility: External viewers and public search will see only
                allowlisted fields (Name, Degree, Branch, Batch, Skills, and Public-marked Projects,
                Certifications, and Internships). Email, phone number, enrollment number, backlogs,
                and private documents remain protected.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => handleVisibilityAction("Public")}
                  className="px-3.5 py-1.5 rounded-xl bg-[#3730a3] text-white text-xs font-bold hover:bg-[#2e288a]"
                >
                  Confirm Publish as Public
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPublicTarget(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blocking Validation Errors */}
      {errors.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
            <FiAlertCircle className="w-3.5 h-3.5" />
            Blocking Validation Errors ({errors.length})
          </h4>
          <div className="space-y-2">
            {errors.map((err, idx) => (
              <div
                key={`${err.section}_${err.code}_${idx}`}
                className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 mr-2">
                    [{err.code}]
                  </span>
                  <span className="text-xs font-semibold text-slate-800">{err.message}</span>
                </div>
                {isSelfStudent && err.action?.web_path && (
                  <Link
                    to={err.action.web_path}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3730a3] hover:underline shrink-0"
                  >
                    Fix <FiArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisory Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <FiAlertTriangle className="w-3.5 h-3.5" />
            Advisory Warnings (Do Not Block Publishing)
          </h4>
          <div className="flex flex-wrap gap-2">
            {warnings.map((warn, idx) => (
              <div
                key={`${warn.section}_${warn.code}_${idx}`}
                className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-900 inline-flex items-center gap-2"
              >
                <span>{warn.message}</span>
                {isSelfStudent && warn.action?.web_path && (
                  <Link to={warn.action.web_path} className="text-[#3730a3] font-bold hover:underline">
                    Open
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.length === 0 && (
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
          <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile passes all blocking validation checks and is eligible for publishing.</span>
        </div>
      )}

      {/* Audience Preview (Student / Admin) */}
      {(isSelfStudent || isAdminStaff) && (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FiEye className="w-3.5 h-3.5 text-[#3730a3]" />
              Audience View Preview
            </span>
            <div className="flex flex-wrap gap-2">
              {["PUBLIC", "INSTITUTE"].map((aud) => (
                <button
                  key={aud}
                  type="button"
                  onClick={() => handleLoadPreview(aud)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    previewAudience === aud
                      ? "bg-[#3730a3] text-white border-[#3730a3]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  Preview as {aud === "PUBLIC" ? "Public" : "Institute"}
                </button>
              ))}
            </div>
          </div>

          {previewLoading && <p className="text-xs text-slate-500">Loading audience preview...</p>}

          {!previewLoading && previewData?.profile && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-extrabold text-slate-800">
                Preview Audience: {previewData.audience}
              </div>
              <div className="text-slate-600">
                Visible Fields: Name ({previewData.profile.student_name || "—"}), Degree (
                {previewData.profile.degree_name || "—"}), Branch (
                {previewData.profile.branch_name || "—"}), Skills (
                {previewData.profile.skills?.length ?? 0}), Projects (
                {previewData.profile.projects?.length ?? 0}), Certifications (
                {previewData.profile.certifications?.length ?? 0}), Internships (
                {previewData.profile.internships?.length ?? 0})
              </div>
              {previewData.audience === "PUBLIC" && (
                <div className="text-[11px] text-emerald-700 font-semibold">
                  Protected fields verified omitted from public payload: email, phone, enrollment,
                  backlogs, raw institute IDs, certificate files, and private resume documents.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin Override Controls */}
      {isAdminStaff && (
        <form onSubmit={handleAdminOverride} className="pt-3 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Administrator Visibility Override
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={overrideState}
              onChange={(e) => setOverrideState(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
            >
              <option value="NONE">NONE (Owner Controlled)</option>
              <option value="RESTRICTED_PRIVATE">RESTRICTED_PRIVATE (Force Private)</option>
              <option value="SUSPENDED">SUSPENDED (Suspend Visibility)</option>
            </select>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Audit reason for override..."
              maxLength={300}
              className="sm:col-span-2 px-3 py-2 border border-slate-300 rounded-xl text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={mutating}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold disabled:opacity-50"
          >
            {mutating ? "Saving Override..." : "Apply Admin Override"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProfileValidationVisibilityCard;
