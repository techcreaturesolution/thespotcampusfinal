import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FiFileText,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiStar,
  FiEye,
  FiDownload,
  FiShare2,
  FiX,
  FiSearch,
  FiAlertCircle,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "./Loading";
import {
  RESUME_SECTION_META,
  RESUME_FONT_OPTIONS,
  RESUME_LAYOUT_OPTIONS,
  RESUME_MARGIN_OPTIONS,
  RESUME_STATUS_OPTIONS,
  RESUME_VISIBILITY_OPTIONS,
  validateResumeVersionForm,
} from "../../utils/resumeVersionsValidation";

const DEFAULT_SECTIONS = RESUME_SECTION_META.map((s, idx) => ({
  section_key: s.key,
  enabled: true,
  order: idx,
}));

const INITIAL_FORM = {
  name: "",
  target_role: "",
  description: "",
  summary: "",
  template_id: "",
  font_family: "Inter",
  color_theme: "#3730a3",
  layout_columns: "two_column_left",
  page_margin: "medium",
  visibility: "Private",
  status: "Active",
  is_default: false,
  include_academic_summary: true,
  include_skill_proficiency: true,
  include_project_links: true,
};

const ResumeVersionsSection = ({ studentId = null, role = "Student", canEdit = true }) => {
  const isSelfMode = !studentId && role === "Student";
  const baseEndpoint = isSelfMode
    ? "/resume-versions/me"
    : `/resume-versions/student/${studentId}`;

  const [versions, setVersions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Canonical profile items for item-level selection
  const [canonicalSkills, setCanonicalSkills] = useState([]);
  const [canonicalProjects, setCanonicalProjects] = useState([]);
  const [canonicalCerts, setCanonicalCerts] = useState([]);
  const [canonicalInternships, setCanonicalInternships] = useState([]);
  const [canonicalHistory, setCanonicalHistory] = useState([]);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [sectionConfig, setSectionConfig] = useState(DEFAULT_SECTIONS);
  const [selSkills, setSelSkills] = useState([]);
  const [selProjects, setSelProjects] = useState([]);
  const [selCerts, setSelCerts] = useState([]);
  const [selInternships, setSelInternships] = useState([]);
  const [selHistory, setSelHistory] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const qs = params.toString() ? `?${params.toString()}` : "";
      const { data } = await customFetch.get(`${baseEndpoint}${qs}`);
      setVersions(data.resume_versions || []);
      setTemplates(data.templates || []);
    } catch (error) {
      setErrorMsg(error?.response?.data?.msg || "Failed to load resume versions");
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, statusFilter, searchTerm]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const loadCanonicalOptions = useCallback(async () => {
    if (!isSelfMode) return;
    try {
      const [skRes, prRes, certRes, intRes, histRes] = await Promise.all([
        customFetch.get("/skills/me?limit=50"),
        customFetch.get("/projects/me?limit=50"),
        customFetch.get("/certifications/me?limit=50"),
        customFetch.get("/internships/me?limit=50"),
        customFetch.get("/academic-profile/me/history"),
      ]);
      setCanonicalSkills(skRes.data?.skills || []);
      setCanonicalProjects(prRes.data?.projects || []);
      setCanonicalCerts(certRes.data?.certifications || []);
      setCanonicalInternships(intRes.data?.internships || []);
      setCanonicalHistory(histRes.data?.academic_history || []);
    } catch {
      // ignore non-critical dropdown fetch failure
    }
  }, [isSelfMode]);

  const openCreateModal = async () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setSectionConfig(DEFAULT_SECTIONS);
    setSelSkills([]);
    setSelProjects([]);
    setSelCerts([]);
    setSelInternships([]);
    setSelHistory([]);
    setFormErrors({});
    setShowForm(true);
    await loadCanonicalOptions();
  };

  const openEditModal = async (ver) => {
    setEditingId(ver.id);
    setFormData({
      name: ver.name || "",
      target_role: ver.target_role || "",
      description: ver.description || "",
      summary: ver.summary || "",
      template_id: ver.template_id || "",
      font_family: ver.font_family || "Inter",
      color_theme: ver.color_theme || "#3730a3",
      layout_columns: ver.layout_columns || "two_column_left",
      page_margin: ver.page_margin || "medium",
      visibility: ver.visibility || "Private",
      status: ver.status || "Active",
      is_default: Boolean(ver.is_default),
      include_academic_summary: ver.include_academic_summary !== false,
      include_skill_proficiency: ver.include_skill_proficiency !== false,
      include_project_links: ver.include_project_links !== false,
    });
    setSectionConfig(ver.section_config?.length ? ver.section_config : DEFAULT_SECTIONS);
    setSelSkills(ver.selected_skill_ids || []);
    setSelProjects(ver.selected_project_ids || []);
    setSelCerts(ver.selected_certification_ids || []);
    setSelInternships(ver.selected_internship_ids || []);
    setSelHistory(ver.selected_education_ids || []);
    setFormErrors({});
    setShowForm(true);
    await loadCanonicalOptions();
  };

  const toggleSelection = (setter, id) => {
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const moveSection = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= sectionConfig.length) return;
    const next = [...sectionConfig];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    setSectionConfig(next.map((s, i) => ({ ...s, order: i })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateResumeVersionForm(formData);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      toast.error("Please fix the highlighted resume version fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        target_role: formData.target_role.trim(),
        description: formData.description.trim(),
        summary: formData.summary.trim(),
        template_id: formData.template_id || null,
        section_config: sectionConfig,
        selected_skill_ids: selSkills,
        selected_project_ids: selProjects,
        selected_certification_ids: selCerts,
        selected_internship_ids: selInternships,
        selected_education_ids: selHistory,
      };

      if (editingId) {
        await customFetch.patch(`${baseEndpoint}/${editingId}`, payload);
        toast.success("Resume version updated");
      } else {
        await customFetch.post(baseEndpoint, payload);
        toast.success("Resume version created");
      }
      setShowForm(false);
      await loadVersions();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to save resume version");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (ver) => {
    try {
      await customFetch.post(`${baseEndpoint}/${ver.id}/duplicate`, {});
      toast.success(`Duplicated "${ver.name}"`);
      await loadVersions();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to duplicate resume version");
    }
  };

  const handleSetDefault = async (ver) => {
    try {
      await customFetch.post(`${baseEndpoint}/${ver.id}/default`, {});
      toast.success(`"${ver.name}" set as default resume`);
      await loadVersions();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to set default resume");
    }
  };

  const handleDelete = async (id) => {
    try {
      await customFetch.delete(`${baseEndpoint}/${id}`);
      toast.success("Resume version removed");
      setConfirmDeleteId(null);
      await loadVersions();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to delete resume version");
    }
  };

  const handleToggleShare = async (ver) => {
    try {
      const { data } = await customFetch.patch(`${baseEndpoint}/${ver.id}/share`, {
        share_enabled: !ver.share_enabled,
        expires_in_days: !ver.share_enabled ? 30 : null,
      });
      const token = data?.resume_version?.share_token;
      if (token && navigator.clipboard) {
        navigator.clipboard
          .writeText(`${window.location.origin}/api/resume-versions/shared/${token}`)
          .catch(() => {});
      }
      toast.success(
        data?.resume_version?.share_enabled
          ? "Share link enabled & copied"
          : "Share link revoked",
      );
      await loadVersions();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update share settings");
    }
  };

  const handlePreview = async (ver) => {
    try {
      const { data } = await customFetch.post(`${baseEndpoint}/${ver.id}/preview`, {});
      setPreviewData(data);
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to render preview");
    }
  };

  const handleDownloadPdf = async (ver) => {
    setDownloadingId(ver.id);
    try {
      const res = await customFetch.get(`${baseEndpoint}/${ver.id}/download-pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ver.name.replace(/[^a-zA-Z0-9-_]+/g, "_") || "resume"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch (error) {
      toast.error(error?.response?.data?.msg || "PDF download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const getSectionLabel = (key) =>
    RESUME_SECTION_META.find((m) => m.key === key)?.label || key;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FiFileText className="text-[#3730a3]" />
            Multiple Resume Versions
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#3730a3]">
              {versions.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Create tailored resumes referencing your canonical skills, projects, internships, certifications, and academics.
          </p>
        </div>
        {canEdit && isSelfMode && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#3730a3] hover:bg-[#2d268c] text-white text-xs font-extrabold shadow-xs cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            New Resume Version
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative">
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resume version name or target role..."
            aria-label="Search resume versions"
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#3730a3]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#3730a3]"
        >
          <option value="">All Statuses</option>
          {RESUME_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loading />
        </div>
      ) : errorMsg ? (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-semibold">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </span>
          <button
            type="button"
            onClick={loadVersions}
            className="px-3 py-1 rounded-lg bg-white border border-red-200 font-bold"
          >
            Retry
          </button>
        </div>
      ) : versions.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-[#3730a3] flex items-center justify-center mb-3">
            <FiFileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No resume versions yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Create dedicated resumes for Backend, Data Science, or Internship roles without duplicating your profile data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {versions.map((ver) => (
            <div
              key={ver.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-indigo-200 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900">{ver.name}</h4>
                      {ver.is_default && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <FiStar className="w-3 h-3" /> Default
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {ver.visibility}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#3730a3]">
                        {ver.status}
                      </span>
                    </div>
                    {ver.target_role && (
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {ver.target_role}
                      </p>
                    )}
                  </div>
                </div>

                {ver.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{ver.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200">
                    Skills: {ver.selected_skill_ids?.length || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200">
                    Projects: {ver.selected_project_ids?.length || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200">
                    Internships: {ver.selected_internship_ids?.length || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200">
                    Certs: {ver.selected_certification_ids?.length || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePreview(ver)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] text-xs font-bold"
                >
                  <FiEye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(ver)}
                  disabled={downloadingId === ver.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-50"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  {downloadingId === ver.id ? "PDF..." : "PDF"}
                </button>
                {canEdit && isSelfMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditModal(ver)}
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
                      title="Edit version"
                      aria-label="Edit resume version"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(ver)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                      title="Duplicate configuration"
                      aria-label="Duplicate resume version"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                    {!ver.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(ver)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                        title="Set as default"
                        aria-label="Set as default resume version"
                      >
                        <FiStar className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleShare(ver)}
                      className={`p-1.5 rounded-lg ${
                        ver.share_enabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      title={ver.share_enabled ? "Revoke share link" : "Create share link"}
                      aria-label="Toggle share link"
                    >
                      <FiShare2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(ver.id)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                      title="Delete version"
                      aria-label="Delete resume version"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {confirmDeleteId === ver.id && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-red-800">Delete &ldquo;{ver.name}&rdquo;?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ver.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sandboxed Live Preview Modal */}
      {previewData && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Resume Version Preview"
        >
          <div className="bg-white w-full max-w-4xl h-[88vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {previewData.resume_version?.name} — Preview ({previewData.template_name})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                aria-label="Close preview"
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <iframe
              title="Resume Version Live Preview"
              sandbox="allow-same-origin"
              srcDoc={previewData.compiled_html}
              className="w-full flex-1 bg-slate-100 border-0"
            />
          </div>
        </div>
      )}

      {/* Create / Edit Configuration Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? "Edit Resume Version" : "Create Resume Version"}
        >
          <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingId ? "Configure Resume Version" : "New Resume Version"}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close modal"
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resume Version Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Backend Engineer — Placement"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Role / Headline
                  </label>
                  <input
                    type="text"
                    value={formData.target_role}
                    onChange={(e) => setFormData((p) => ({ ...p, target_role: e.target.value }))}
                    placeholder="e.g., Node.js & Cloud Backend Developer"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Professional Summary (for this version)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.summary}
                    onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Template</label>
                  <select
                    value={formData.template_id}
                    onChange={(e) => setFormData((p) => ({ ...p, template_id: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">Default Template</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Font Family</label>
                  <select
                    value={formData.font_family}
                    onChange={(e) => setFormData((p) => ({ ...p, font_family: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    {RESUME_FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Layout</label>
                  <select
                    value={formData.layout_columns}
                    onChange={(e) => setFormData((p) => ({ ...p, layout_columns: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    {RESUME_LAYOUT_OPTIONS.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accent Color &amp; Margins</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color_theme}
                      onChange={(e) => setFormData((p) => ({ ...p, color_theme: e.target.value }))}
                      className="h-9 w-12 rounded border border-slate-300"
                    />
                    <select
                      value={formData.page_margin}
                      onChange={(e) => setFormData((p) => ({ ...p, page_margin: e.target.value }))}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                    >
                      {RESUME_MARGIN_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          Margin: {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Visibility</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData((p) => ({ ...p, visibility: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    {RESUME_VISIBILITY_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-center gap-1.5 pt-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData((p) => ({ ...p, is_default: e.target.checked }))}
                    />
                    Set as default resume version
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.include_skill_proficiency}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, include_skill_proficiency: e.target.checked }))
                      }
                    />
                    Include S1-03 proficiency levels
                  </label>
                </div>

                {/* Section Order & Toggles */}
                <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Sections &amp; Order
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sectionConfig.map((sec, idx) => (
                      <div
                        key={sec.section_key}
                        className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <label className="inline-flex items-center gap-2 font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={sec.enabled}
                            onChange={() =>
                              setSectionConfig((prev) =>
                                prev.map((s) =>
                                  s.section_key === sec.section_key
                                    ? { ...s, enabled: !s.enabled }
                                    : s,
                                ),
                              )
                            }
                          />
                          {getSectionLabel(sec.section_key)}
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveSection(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-slate-500 disabled:opacity-30"
                          >
                            <FiArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 1)}
                            disabled={idx === sectionConfig.length - 1}
                            className="p-1 text-slate-500 disabled:opacity-30"
                          >
                            <FiArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Canonical Profile Item Selection */}
                {canonicalSkills.length > 0 && (
                  <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Technical Skills ({selSkills.length} selected)
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {canonicalSkills.map((sk) => {
                        const active = selSkills.includes(sk.id);
                        return (
                          <button
                            key={sk.id}
                            type="button"
                            onClick={() => toggleSelection(setSelSkills, sk.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              active
                                ? "bg-[#3730a3] text-white border-[#3730a3]"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {sk.skill?.name || sk.name} ({sk.proficiency})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {canonicalProjects.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Projects ({selProjects.length} selected)
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {canonicalProjects.map((pr) => {
                        const active = selProjects.includes(pr.id);
                        return (
                          <button
                            key={pr.id}
                            type="button"
                            onClick={() => toggleSelection(setSelProjects, pr.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              active
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {pr.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {canonicalInternships.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Internships ({selInternships.length} selected)
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {canonicalInternships.map((it) => {
                        const active = selInternships.includes(it.id);
                        return (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => toggleSelection(setSelInternships, it.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              active
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {it.role_title} @ {it.organization_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {canonicalCerts.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Certifications ({selCerts.length} selected)
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {canonicalCerts.map((c) => {
                        const active = selCerts.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleSelection(setSelCerts, c.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              active
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {c.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {canonicalHistory.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Past Academic History ({selHistory.length} selected)
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {canonicalHistory.map((h) => {
                        const active = selHistory.includes(h._id || h.id);
                        const hId = h._id || h.id;
                        return (
                          <button
                            key={hId}
                            type="button"
                            onClick={() => toggleSelection(setSelHistory, hId)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              active
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {h.stage_type}: {h.institution_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#3730a3] hover:bg-[#2d268c] text-white text-xs font-extrabold disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Version" : "Create Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeVersionsSection;
