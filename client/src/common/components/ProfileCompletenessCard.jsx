import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiRefreshCw,
  FiTrendingUp,
  FiStar,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const BAND_STYLES = {
  COMPLETE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  STRONG: "bg-indigo-50 text-[#3730a3] border-indigo-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  NEEDS_ATTENTION: "bg-rose-50 text-rose-700 border-rose-200",
  EMPTY: "bg-slate-100 text-slate-600 border-slate-200",
  NOT_APPLICABLE: "bg-slate-100 text-slate-500 border-slate-200",
};

const PROGRESS_BAR_COLORS = {
  COMPLETE: "from-emerald-500 to-teal-500",
  STRONG: "from-[#3730a3] to-blue-500",
  IN_PROGRESS: "from-amber-500 to-orange-500",
  NEEDS_ATTENTION: "from-rose-500 to-pink-500",
  EMPTY: "from-slate-300 to-slate-400",
  NOT_APPLICABLE: "from-slate-300 to-slate-400",
};

const ProfileCompletenessCard = ({
  studentId = null,
  refreshKey = 0,
  compact = false,
  showActionLinks = true,
  initialCompleteness = null,
  onLoaded = null,
}) => {
  const [completeness, setCompleteness] = useState(initialCompleteness);
  const [loading, setLoading] = useState(!initialCompleteness);
  const [errorMsg, setErrorMsg] = useState("");

  const endpoint = studentId
    ? `/profile-completeness/student/${studentId}`
    : "/profile-completeness/me";

  const fetchCompleteness = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data } = await customFetch.get(endpoint);
      const payload = data?.completeness || null;
      setCompleteness(payload);
      if (onLoaded && payload) onLoaded(payload);
    } catch (error) {
      setErrorMsg(error?.response?.data?.msg || "Failed to load profile completeness");
    } finally {
      setLoading(false);
    }
  }, [endpoint, onLoaded]);

  useEffect(() => {
    if (initialCompleteness) {
      setCompleteness(initialCompleteness);
      setLoading(false);
      return;
    }
    fetchCompleteness();
  }, [fetchCompleteness, initialCompleteness, refreshKey]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse">
        <div className="h-4 w-44 bg-slate-200 rounded mb-3" />
        <div className="h-2.5 w-full bg-slate-100 rounded-full mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-slate-800">Profile Completeness Unavailable</h4>
            <p className="text-xs text-slate-500 mt-0.5">{errorMsg}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchCompleteness}
          className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 shrink-0"
        >
          <FiRefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (!completeness) return null;

  const pct = Number(completeness.percentage) || 0;
  const bandKey = completeness.status_band || "EMPTY";
  const bandStyle = BAND_STYLES[bandKey] || BAND_STYLES.EMPTY;
  const barGradient = PROGRESS_BAR_COLORS[bandKey] || PROGRESS_BAR_COLORS.STRONG;
  const applicableSections = (completeness.sections || []).filter((s) => s.applicable);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#3730a3] flex items-center justify-center shrink-0">
            <FiTrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">Profile Completeness</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${bandStyle}`}
              >
                {completeness.status_label || "In Progress"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {completeness.completed_sections} of {completeness.total_applicable_sections} required profile sections completed
              {completeness.applicable_weight > 0
                ? ` • ${completeness.earned_weight}/${completeness.applicable_weight} score points`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="text-right">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{pct}%</span>
          </div>
          {!initialCompleteness && (
            <button
              type="button"
              onClick={fetchCompleteness}
              title="Refresh completeness score"
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-[#3730a3] hover:bg-indigo-50/50 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>

      {/* Section breakdown */}
      {applicableSections.length > 0 && (
        <div className={`grid grid-cols-1 ${compact ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"} gap-3`}>
          {applicableSections.map((sec) => (
            <div
              key={sec.key}
              className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between gap-2.5 ${
                sec.is_complete
                  ? "bg-emerald-50/40 border-emerald-200/70"
                  : sec.is_optional
                    ? "bg-slate-50/70 border-slate-200/80"
                    : "bg-amber-50/30 border-amber-200/70"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-800 truncate">{sec.title}</h4>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {sec.is_optional
                        ? `Optional (${sec.counts?.active_count ?? 0} added)`
                        : `Weight ${sec.weight}% • ${sec.percentage}%`}
                    </span>
                  </div>
                  {sec.is_complete ? (
                    <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : sec.is_optional ? (
                    <FiStar className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                </div>

                {!sec.is_optional && (
                  <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mt-2 border border-slate-200/60">
                    <div
                      className={`h-full rounded-full ${
                        sec.is_complete ? "bg-emerald-500" : "bg-[#3730a3]"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, sec.percentage))}%` }}
                    />
                  </div>
                )}
              </div>

              {showActionLinks && sec.action?.web_path && (
                <Link
                  to={sec.action.web_path}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3730a3] hover:underline"
                >
                  {sec.is_complete ? "View / Update" : sec.action.label}
                  <FiArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actionable Missing Checklist */}
      {Array.isArray(completeness.missing_items) && completeness.missing_items.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Action Items to Reach 100% ({completeness.missing_items.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {completeness.missing_items.slice(0, compact ? 4 : 12).map((item) =>
              showActionLinks && item.action?.web_path ? (
                <Link
                  key={`${item.section_key}_${item.key}`}
                  to={item.action.web_path}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200/80 text-[11px] font-semibold transition-colors"
                >
                  <span>{item.label}</span>
                  <FiArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <span
                  key={`${item.section_key}_${item.key}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-semibold"
                >
                  {item.label}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {/* Optional Recommendations */}
      {!compact &&
        Array.isArray(completeness.recommendations) &&
        completeness.recommendations.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Optional Profile Boosters
            </h4>
            <div className="flex flex-wrap gap-2">
              {completeness.recommendations.map((rec) =>
                showActionLinks && rec.action?.web_path ? (
                  <Link
                    key={rec.key}
                    to={rec.action.web_path}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/70 text-[#3730a3] border border-indigo-200/60 text-[11px] font-semibold transition-colors"
                  >
                    <span>{rec.label}</span>
                    <FiArrowRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <span
                    key={rec.key}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold"
                  >
                    {rec.label}
                  </span>
                ),
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default ProfileCompletenessCard;
