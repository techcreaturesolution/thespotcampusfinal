import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FiBookOpen,
  FiEdit2,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiLock,
  FiClock,
  FiAward,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "./Loading";
import {
  ACADEMIC_STATUS_OPTIONS,
  HISTORY_STAGE_OPTIONS,
  HISTORY_STATUS_OPTIONS,
  SCORE_TYPE_OPTIONS,
  validateAcademicProfileForm,
  validateAcademicHistoryForm,
} from "../../utils/academicProfileValidation";

const INITIAL_HISTORY_FORM = {
  stage_type: "12th",
  institution_name: "",
  board_or_university: "",
  program_name: "",
  department_name: "",
  academic_year: "",
  semester_or_year: "",
  start_year: "",
  end_year: "",
  score_type: "Percentage",
  score_value: "",
  status: "Completed",
  remarks: "",
};

const AcademicProfileSection = ({
  studentId = null,
  role = "Student",
  canEdit = true,
  onUpdated = null,
  compact = false,
}) => {
  const isSelfMode = !studentId && role === "Student";
  const baseEndpoint = isSelfMode
    ? "/academic-profile/me"
    : `/academic-profile/student/${studentId}`;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Cascading dropdowns
  const [universities, setUniversities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [branches, setBranches] = useState([]);

  // Academic History
  const [history, setHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [historyForm, setHistoryForm] = useState(INITIAL_HISTORY_FORM);
  const [historyErrors, setHistoryErrors] = useState({});
  const [savingHistory, setSavingHistory] = useState(false);

  // Audit logs
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const mapProfileToForm = (ap) => ({
    university_id: ap?.university_id || "",
    college_id: ap?.college_id || "",
    degree_id: ap?.degree_id || "",
    branch_id: ap?.branch_id || "",
    student_enrollment: ap?.student_enrollment || "",
    student_current_sem: ap?.student_current_sem || "",
    student_total_backlog: ap?.student_total_backlog ?? "0",
    academic_year: ap?.academic_year || "",
    academic_batch: ap?.academic_batch || "",
    academic_status: ap?.academic_status || "Active",
    cgpa: ap?.cgpa ?? "",
    percentage: ap?.percentage ?? "",
    admission_year: ap?.admission_year ?? "",
    expected_graduation_year: ap?.expected_graduation_year ?? "",
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data } = await customFetch.get(baseEndpoint);
      setProfile(data.academic_profile);
      setCompletion(data.completion);
      setFormData(mapProfileToForm(data.academic_profile));
    } catch (error) {
      setErrorMsg(error?.response?.data?.msg || "Failed to load academic profile");
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint]);

  const fetchHistory = useCallback(
    async (page = 1) => {
      setHistoryLoading(true);
      try {
        const { data } = await customFetch.get(`${baseEndpoint}/history?page=${page}&limit=10`);
        setHistory(data.history || []);
        setHistoryPagination(data.pagination || { page: 1, total_pages: 1, total: 0 });
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [baseEndpoint],
  );

  useEffect(() => {
    if (!isSelfMode && !studentId) return;
    fetchProfile();
    fetchHistory(1);
  }, [fetchProfile, fetchHistory, isSelfMode, studentId]);

  // Load dropdown options when editing
  useEffect(() => {
    if (!isEditing) return;
    customFetch
      .get("/dropdown/universities")
      .then(({ data }) => setUniversities(data.universities || []))
      .catch(() => setUniversities([]));
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing || !formData.university_id) {
      setColleges([]);
      return;
    }
    customFetch
      .get(`/dropdown/colleges?university_id=${formData.university_id}`)
      .then(({ data }) => setColleges(data.colleges || []))
      .catch(() => setColleges([]));
  }, [isEditing, formData.university_id]);

  useEffect(() => {
    if (!isEditing || !formData.college_id) {
      setDegrees([]);
      return;
    }
    customFetch
      .get(`/dropdown/degrees?college_id=${formData.college_id}`)
      .then(({ data }) => setDegrees(data.degrees || []))
      .catch(() => setDegrees([]));
  }, [isEditing, formData.college_id]);

  useEffect(() => {
    if (!isEditing || !formData.degree_id) {
      setBranches([]);
      return;
    }
    customFetch
      .get(`/dropdown/branches?degree_id=${formData.degree_id}&college_id=${formData.college_id || ""}`)
      .then(({ data }) => setBranches(data.branches || []))
      .catch(() => setBranches([]));
  }, [isEditing, formData.degree_id, formData.college_id]);

  const fetchAuditLogs = async () => {
    const targetId = studentId || profile?.student_id;
    if (!targetId) return;
    setAuditLoading(true);
    try {
      const { data } = await customFetch.get(`/academic-profile/student/${targetId}/audit-logs?limit=15`);
      setAuditLogs(data.logs || []);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const identityLockedForStudent = role === "Student" && Boolean(profile?.isVerifiedByTPO);
  const canEditIdentity =
    canEdit &&
    ((role === "Student" && !profile?.isVerifiedByTPO) || ["Admin", "College", "TPO"].includes(role));
  const canEditCollege = canEdit && (role === "Admin" || (role === "Student" && !profile?.isVerifiedByTPO));
  const canEditDegree =
    canEdit && (role === "Admin" || role === "College" || role === "TPO" || (role === "Student" && !profile?.isVerifiedByTPO));

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "university_id") {
        next.college_id = "";
        next.degree_id = "";
        next.branch_id = "";
      } else if (name === "college_id") {
        next.degree_id = "";
        next.branch_id = "";
      } else if (name === "degree_id") {
        next.branch_id = "";
      }
      return next;
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const validationErrors = validateAcademicProfileForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      toast.error("Please fix the highlighted validation errors");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData };
      if (identityLockedForStudent) {
        delete payload.university_id;
        delete payload.college_id;
        delete payload.degree_id;
        delete payload.branch_id;
        delete payload.student_enrollment;
        delete payload.admission_year;
        delete payload.academic_status;
      } else if (role === "Student") {
        delete payload.academic_status;
      }

      if (role === "College" || role === "TPO") {
        delete payload.university_id;
        delete payload.college_id;
      }

      const { data } = await customFetch.patch(baseEndpoint, payload);
      setProfile(data.academic_profile);
      setCompletion(data.completion);
      setFormData(mapProfileToForm(data.academic_profile));
      setIsEditing(false);
      toast.success("Academic profile updated successfully");
      fetchHistory(1);
      if (showAuditLogs) fetchAuditLogs();
      if (onUpdated) await onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update academic profile");
    } finally {
      setSaving(false);
    }
  };

  const openAddHistory = () => {
    setEditingHistoryId(null);
    setHistoryForm(INITIAL_HISTORY_FORM);
    setHistoryErrors({});
    setShowHistoryForm(true);
  };

  const openEditHistory = (item) => {
    setEditingHistoryId(item._id);
    setHistoryForm({
      stage_type: item.stage_type || "Other",
      institution_name: item.institution_name || "",
      board_or_university: item.board_or_university || "",
      program_name: item.program_name || "",
      department_name: item.department_name || "",
      academic_year: item.academic_year || "",
      semester_or_year: item.semester_or_year || "",
      start_year: item.start_year ?? "",
      end_year: item.end_year ?? "",
      score_type: item.score_type || "Percentage",
      score_value: item.score_value || "",
      status: item.status || "Completed",
      remarks: item.remarks || "",
    });
    setHistoryErrors({});
    setShowHistoryForm(true);
  };

  const handleSaveHistory = async (e) => {
    e.preventDefault();
    const errs = validateAcademicHistoryForm(historyForm);
    if (Object.keys(errs).length > 0) {
      setHistoryErrors(errs);
      return;
    }

    setSavingHistory(true);
    try {
      const endpoint = editingHistoryId
        ? `${baseEndpoint}/history/${editingHistoryId}`
        : `${baseEndpoint}/history`;
      const method = editingHistoryId ? "patch" : "post";

      await customFetch[method](endpoint, historyForm);
      toast.success(editingHistoryId ? "Academic history updated" : "Academic history added");
      setShowHistoryForm(false);
      setEditingHistoryId(null);
      await Promise.all([fetchProfile(), fetchHistory(historyPagination.page)]);
      if (showAuditLogs) fetchAuditLogs();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to save academic history");
    } finally {
      setSavingHistory(false);
    }
  };

  const handleDeleteHistory = async (historyId) => {
    if (!window.confirm("Remove this academic history record?")) return;
    try {
      await customFetch.delete(`${baseEndpoint}/history/${historyId}`);
      toast.success("Academic history record removed");
      await Promise.all([fetchProfile(), fetchHistory(1)]);
      if (showAuditLogs) fetchAuditLogs();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to delete academic history");
    }
  };

  const inputClass = (fieldName, disabled = false) =>
    `w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
      disabled
        ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
        : formErrors[fieldName]
          ? "bg-white border-rose-400 text-slate-900 focus:border-rose-500"
          : "bg-white border-slate-300 text-slate-900 focus:border-[#3730a3]"
    }`;

  if (loading) return <Loading />;

  if (errorMsg) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
        <FiAlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-bold text-rose-700">{errorMsg}</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-5" : "space-y-6"}>
      {/* Completion & Identity Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-[#3730a3] flex items-center justify-center shrink-0">
              <FiAward className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {profile?.student_name || "Student Academic Identity"}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    profile?.isVerifiedByTPO
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {profile?.isVerifiedByTPO ? (
                    <>
                      <FiCheckCircle className="w-3 h-3" /> TPO Verified
                    </>
                  ) : (
                    <>
                      <FiClock className="w-3 h-3" /> Verification Pending
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile?.degree?.degree_name || "Degree not assigned"} •{" "}
                {profile?.branch?.branch_name || "Branch not assigned"} •{" "}
                {profile?.college?.college_name || "College not assigned"}
              </p>
            </div>
          </div>

          {completion && (
            <div className="sm:text-right min-w-[180px]">
              <div className="flex items-center sm:justify-end gap-2 text-xs font-extrabold text-slate-700">
                <span>Profile Completion</span>
                <span className="text-[#3730a3]">{completion.percentage}%</span>
              </div>
              <div className="w-full sm:w-44 h-2 bg-slate-100 rounded-full overflow-hidden mt-1.5 ml-auto">
                <div
                  className="h-full bg-gradient-to-r from-[#3730a3] to-blue-500 transition-all duration-300"
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {completion.completed_count} of {completion.total_fields} academic checkpoints complete
              </p>
            </div>
          )}
        </div>

        {completion && completion.missing_fields?.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Missing:</span>
            {completion.missing_fields.map((item) => (
              <span
                key={item.key}
                className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/70 text-[11px] font-semibold"
              >
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Academic Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <FiBookOpen className="w-4 h-4 text-[#3730a3]" />
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Academic Information
            </h3>
          </div>
          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <FiEdit2 className="w-3.5 h-3.5" /> Edit Academic Info
            </button>
          )}
        </div>

        {identityLockedForStudent && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-800">
            <FiLock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Your institutional fields (University, College, Degree, Branch, Enrollment No., Admission Year) are locked after TPO verification. You can update your current semester, backlogs, CGPA/percentage, academic year, and batch.
            </span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* University */}
            <div className="space-y-1.5">
              <label htmlFor="ap_university_id" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                University
              </label>
              {isEditing && canEditCollege ? (
                <select
                  id="ap_university_id"
                  name="university_id"
                  value={formData.university_id || ""}
                  onChange={handleFieldChange}
                  className={inputClass("university_id", false)}
                >
                  <option value="">Select University</option>
                  {universities.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.university_name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="ap_university_id"
                  type="text"
                  value={profile?.university?.university_name || "—"}
                  disabled
                  className={inputClass("university_id", true)}
                />
              )}
            </div>

            {/* College */}
            <div className="space-y-1.5">
              <label htmlFor="ap_college_id" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                College
              </label>
              {isEditing && canEditCollege ? (
                <select
                  id="ap_college_id"
                  name="college_id"
                  value={formData.college_id || ""}
                  onChange={handleFieldChange}
                  disabled={!formData.university_id}
                  className={inputClass("college_id", !formData.university_id)}
                >
                  <option value="">Select College</option>
                  {colleges.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.college_name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="ap_college_id"
                  type="text"
                  value={profile?.college?.college_name || "—"}
                  disabled
                  className={inputClass("college_id", true)}
                />
              )}
            </div>

            {/* Degree */}
            <div className="space-y-1.5">
              <label htmlFor="ap_degree_id" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Degree / Program
              </label>
              {isEditing && canEditDegree && role !== "TPO" ? (
                <select
                  id="ap_degree_id"
                  name="degree_id"
                  value={formData.degree_id || ""}
                  onChange={handleFieldChange}
                  disabled={!formData.college_id}
                  className={inputClass("degree_id", !formData.college_id)}
                >
                  <option value="">Select Degree</option>
                  {degrees.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.degree_name} {d.degree_code ? `(${d.degree_code})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="ap_degree_id"
                  type="text"
                  value={profile?.degree?.degree_name || "—"}
                  disabled
                  className={inputClass("degree_id", true)}
                />
              )}
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <label htmlFor="ap_branch_id" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Branch / Department
              </label>
              {isEditing && canEditDegree ? (
                <select
                  id="ap_branch_id"
                  name="branch_id"
                  value={formData.branch_id || ""}
                  onChange={handleFieldChange}
                  disabled={!formData.degree_id}
                  className={inputClass("branch_id", !formData.degree_id)}
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="ap_branch_id"
                  type="text"
                  value={profile?.branch?.branch_name || "—"}
                  disabled
                  className={inputClass("branch_id", true)}
                />
              )}
            </div>

            {/* Enrollment Number */}
            <div className="space-y-1.5">
              <label htmlFor="ap_student_enrollment" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Enrollment Number
              </label>
              <input
                id="ap_student_enrollment"
                type="text"
                name="student_enrollment"
                value={formData.student_enrollment || ""}
                onChange={handleFieldChange}
                disabled={!isEditing || !canEditIdentity}
                aria-invalid={Boolean(formErrors.student_enrollment)}
                className={inputClass("student_enrollment", !isEditing || !canEditIdentity)}
              />
              {formErrors.student_enrollment && (
                <p className="text-xs text-rose-600 font-semibold">{formErrors.student_enrollment}</p>
              )}
            </div>

            {/* Academic Status */}
            <div className="space-y-1.5">
              <label htmlFor="ap_academic_status" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Academic Status
              </label>
              <select
                id="ap_academic_status"
                name="academic_status"
                value={formData.academic_status || "Active"}
                onChange={handleFieldChange}
                disabled={!isEditing || role === "Student" || !canEdit}
                className={inputClass("academic_status", !isEditing || role === "Student" || !canEdit)}
              >
                {ACADEMIC_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div className="space-y-1.5">
              <label htmlFor="ap_academic_year" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Academic Year
              </label>
              <input
                id="ap_academic_year"
                type="text"
                name="academic_year"
                placeholder="e.g. 2025-26"
                value={formData.academic_year || ""}
                onChange={handleFieldChange}
                disabled={!isEditing || !canEdit}
                aria-invalid={Boolean(formErrors.academic_year)}
                className={inputClass("academic_year", !isEditing || !canEdit)}
              />
              {formErrors.academic_year && (
                <p className="text-xs text-rose-600 font-semibold">{formErrors.academic_year}</p>
              )}
            </div>

            {/* Batch */}
            <div className="space-y-1.5">
              <label htmlFor="ap_academic_batch" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Batch
              </label>
              <input
                id="ap_academic_batch"
                type="text"
                name="academic_batch"
                placeholder="e.g. 2022-2026"
                value={formData.academic_batch || ""}
                onChange={handleFieldChange}
                disabled={!isEditing || !canEdit}
                aria-invalid={Boolean(formErrors.academic_batch)}
                className={inputClass("academic_batch", !isEditing || !canEdit)}
              />
              {formErrors.academic_batch && (
                <p className="text-xs text-rose-600 font-semibold">{formErrors.academic_batch}</p>
              )}
            </div>

            {/* Current Semester */}
            <div className="space-y-1.5">
              <label htmlFor="ap_student_current_sem" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Current Semester
              </label>
              <input
                id="ap_student_current_sem"
                type="number"
                min="1"
                max="16"
                name="student_current_sem"
                value={formData.student_current_sem || ""}
                onChange={handleFieldChange}
                disabled={!isEditing || !canEdit}
                aria-invalid={Boolean(formErrors.student_current_sem)}
                className={inputClass("student_current_sem", !isEditing || !canEdit)}
              />
              {formErrors.student_current_sem && (
                <p className="text-xs text-rose-600 font-semibold">{formErrors.student_current_sem}</p>
              )}
            </div>

            {/* Total Backlogs */}
            <div className="space-y-1.5">
              <label htmlFor="ap_student_total_backlog" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Backlogs
              </label>
              <input
                id="ap_student_total_backlog"
                type="number"
                min="0"
                max="50"
                name="student_total_backlog"
                value={formData.student_total_backlog ?? "0"}
                onChange={handleFieldChange}
                disabled={!isEditing || !canEdit}
                aria-invalid={Boolean(formErrors.student_total_backlog)}
                className={inputClass("student_total_backlog", !isEditing || !canEdit)}
              />
              {formErrors.student_total_backlog && (
                <p className="text-xs text-rose-600 font-semibold">{formErrors.student_total_backlog}</p>
              )}
            </div>

            {/* CGPA */}
            <div className="space-y-1.5">
              <label htmlFor="ap_cgpa" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                CGPA (0–10)
              </label>
              <input
                id="ap_cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                name="cgpa"
                placeholder="e.g. 8.45"
                value={formData.cgpa ?? ""}
                onChange={handleFieldChange}
                disabled={!isEditing || !canEdit}
                aria-invalid={Boolean(formErrors.cgpa)}
                className={inputClass("cgpa", !isEditing || !canEdit)}
              />
              {formErrors.cgpa && <p className="text-xs text-rose-600 font-semibold">{formErrors.cgpa}</p>}
            </div>

            {/* Percentage */}
            <div className="space-y-1.5">
              <label htmlFor="ap_percentage" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Percentage (0–100)
              </label>
              <input
                id="ap_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                name="percentage"
                placeholder="e.g. 82.5"
                value={formData.percentage ?? ""}
                onChange={handleFieldChange}
                disabled={!isEditing || !canEdit}
                aria-invalid={Boolean(formErrors.percentage)}
                className={inputClass("percentage", !isEditing || !canEdit)}
              />
              {formErrors.percentage && (
                <p className="text-xs text-rose-600 font-semibold">{formErrors.percentage}</p>
              )}
            </div>

            {/* Admission Year */}
            <div className="space-y-1.5">
              <label htmlFor="ap_admission_year" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Admission Year
              </label>
              <input
                id="ap_admission_year"
                type="number"
                min="1990"
                max="2100"
                name="admission_year"
                placeholder="e.g. 2022"
                value={formData.admission_year ?? ""}
                onChange={handleFieldChange}
                disabled={!isEditing || !canEditIdentity}
                aria-invalid={Boolean(formErrors.admission_year)}
                className={inputClass("admission_year", !isEditing || !canEditIdentity)}
              />
              {formErrors.admission_year && (
                <p className="text-xs text-rose-600 font-semibold">{formErrors.admission_year}</p>
              )}
            </div>

            {/* Expected Graduation Year */}
            <div className="space-y-1.5">
              <label htmlFor="ap_expected_graduation_year" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Expected Graduation Year
              </label>
              <input
                id="ap_expected_graduation_year"
                type="number"
                min="1990"
                max="2100"
                name="expected_graduation_year"
                placeholder="e.g. 2026"
                value={formData.expected_graduation_year ?? ""}
                onChange={handleFieldChange}
                disabled={!isEditing || !canEdit}
                aria-invalid={Boolean(formErrors.expected_graduation_year)}
                className={inputClass("expected_graduation_year", !isEditing || !canEdit)}
              />
              {formErrors.expected_graduation_year && (
                <p className="text-xs text-rose-600 font-semibold">{formErrors.expected_graduation_year}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(mapProfileToForm(profile));
                  setFormErrors({});
                }}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold"
              >
                <FiX className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3730a3] hover:bg-[#2e288a] text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-60"
              >
                <FiSave className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Academic Profile"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Academic History Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Academic History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological record of prior qualifications and stage transitions
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openAddHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#3730a3] hover:bg-[#2e288a] text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add Academic Record
            </button>
          )}
        </div>

        <div className="p-5 sm:p-6">
          {showHistoryForm && (
            <form
              onSubmit={handleSaveHistory}
              className="mb-6 p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-800">
                  {editingHistoryId ? "Edit Academic History" : "Add Academic History"}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowHistoryForm(false)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Close academic history form"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ah_stage_type" className="text-xs font-bold text-slate-600 block mb-1">
                    Stage *
                  </label>
                  <select
                    id="ah_stage_type"
                    value={historyForm.stage_type}
                    onChange={(e) => setHistoryForm({ ...historyForm, stage_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  >
                    {HISTORY_STAGE_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ah_institution_name" className="text-xs font-bold text-slate-600 block mb-1">
                    Institution / School Name *
                  </label>
                  <input
                    id="ah_institution_name"
                    type="text"
                    value={historyForm.institution_name}
                    onChange={(e) => setHistoryForm({ ...historyForm, institution_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                    required
                  />
                  {historyErrors.institution_name && (
                    <p className="text-xs text-rose-600 mt-1">{historyErrors.institution_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ah_board" className="text-xs font-bold text-slate-600 block mb-1">
                    Board / University
                  </label>
                  <input
                    id="ah_board"
                    type="text"
                    value={historyForm.board_or_university}
                    onChange={(e) => setHistoryForm({ ...historyForm, board_or_university: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="ah_program" className="text-xs font-bold text-slate-600 block mb-1">
                    Program / Stream
                  </label>
                  <input
                    id="ah_program"
                    type="text"
                    value={historyForm.program_name}
                    onChange={(e) => setHistoryForm({ ...historyForm, program_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="ah_start_year" className="text-xs font-bold text-slate-600 block mb-1">
                    Start Year *
                  </label>
                  <input
                    id="ah_start_year"
                    type="number"
                    min="1970"
                    max="2100"
                    value={historyForm.start_year}
                    onChange={(e) => setHistoryForm({ ...historyForm, start_year: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                    required
                  />
                  {historyErrors.start_year && (
                    <p className="text-xs text-rose-600 mt-1">{historyErrors.start_year}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ah_end_year" className="text-xs font-bold text-slate-600 block mb-1">
                    End Year
                  </label>
                  <input
                    id="ah_end_year"
                    type="number"
                    min="1970"
                    max="2100"
                    value={historyForm.end_year}
                    onChange={(e) => setHistoryForm({ ...historyForm, end_year: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  />
                  {historyErrors.end_year && (
                    <p className="text-xs text-rose-600 mt-1">{historyErrors.end_year}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ah_score_type" className="text-xs font-bold text-slate-600 block mb-1">
                    Score Type
                  </label>
                  <select
                    id="ah_score_type"
                    value={historyForm.score_type}
                    onChange={(e) => setHistoryForm({ ...historyForm, score_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  >
                    {SCORE_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ah_score_value" className="text-xs font-bold text-slate-600 block mb-1">
                    Score Value
                  </label>
                  <input
                    id="ah_score_value"
                    type="text"
                    placeholder={historyForm.score_type === "CGPA" ? "e.g. 8.9" : "e.g. 86.5"}
                    value={historyForm.score_value}
                    onChange={(e) => setHistoryForm({ ...historyForm, score_value: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  />
                  {historyErrors.score_value && (
                    <p className="text-xs text-rose-600 mt-1">{historyErrors.score_value}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ah_status" className="text-xs font-bold text-slate-600 block mb-1">
                    Status
                  </label>
                  <select
                    id="ah_status"
                    value={historyForm.status}
                    onChange={(e) => setHistoryForm({ ...historyForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  >
                    {HISTORY_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ah_remarks" className="text-xs font-bold text-slate-600 block mb-1">
                    Remarks
                  </label>
                  <input
                    id="ah_remarks"
                    type="text"
                    value={historyForm.remarks}
                    onChange={(e) => setHistoryForm({ ...historyForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHistoryForm(false)}
                  className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingHistory}
                  className="px-4 py-2 bg-[#3730a3] text-white rounded-xl text-xs font-bold disabled:opacity-60"
                >
                  {savingHistory ? "Saving..." : editingHistoryId ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          )}

          {historyLoading ? (
            <p className="text-xs text-slate-500 py-4 text-center">Loading academic history...</p>
          ) : history.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-sm font-bold text-slate-700">No academic history records yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Add your 10th, 12th, Diploma, or previous degree records to complete your academic profile.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const lockedForStudent = item.is_locked && role === "Student";
                return (
                  <div
                    key={item._id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 text-[#3730a3] border border-indigo-100">
                          {item.stage_type}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{item.institution_name}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                          {item.status}
                        </span>
                        {item.is_locked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <FiLock className="w-3 h-3" /> Archived
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {[item.program_name, item.department_name, item.board_or_university]
                          .filter(Boolean)
                          .join(" • ") || "General Qualification"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold">
                        {item.start_year} – {item.end_year || "Present"}
                        {item.score_value ? ` • ${item.score_type}: ${item.score_value}` : ""}
                      </p>
                    </div>

                    {canEdit && !lockedForStudent && (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => openEditHistory(item)}
                          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                          title="Edit record"
                          aria-label={`Edit ${item.stage_type} record`}
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHistory(item._id)}
                          className="p-2 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600"
                          title="Delete record"
                          aria-label={`Delete ${item.stage_type} record`}
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {historyPagination.total_pages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                  <span>
                    Page {historyPagination.page} of {historyPagination.total_pages} ({historyPagination.total} records)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={historyPagination.page <= 1}
                      onClick={() => fetchHistory(historyPagination.page - 1)}
                      className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={historyPagination.page >= historyPagination.total_pages}
                      onClick={() => fetchHistory(historyPagination.page + 1)}
                      className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Activity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => {
            const next = !showAuditLogs;
            setShowAuditLogs(next);
            if (next) fetchAuditLogs();
          }}
          className="w-full px-5 sm:px-6 py-3.5 flex items-center justify-between text-left bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
        >
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Recent Academic Audit Activity
          </span>
          <span className="text-xs font-bold text-[#3730a3]">{showAuditLogs ? "Hide" : "View Logs"}</span>
        </button>

        {showAuditLogs && (
          <div className="p-5 sm:p-6 border-t border-slate-100">
            {auditLoading ? (
              <p className="text-xs text-slate-500">Loading audit logs...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500">No academic audit entries recorded yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {auditLogs.map((log) => (
                  <li
                    key={log._id}
                    className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                  >
                    <div>
                      <span className="font-extrabold text-slate-800">{log.action}</span>
                      <span className="text-slate-500"> by {log.actor_role}</span>
                      {log.changed_fields?.length > 0 && (
                        <span className="text-slate-500"> • Fields: {log.changed_fields.join(", ")}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicProfileSection;
