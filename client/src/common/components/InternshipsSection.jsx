import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FiBriefcase,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiArrowUp,
  FiArrowDown,
  FiX,
  FiSearch,
  FiAlertCircle,
  FiArchive,
  FiLink,
  FiMapPin,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "./Loading";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
  INTERNSHIP_STATUS_OPTIONS,
  INTERNSHIP_VISIBILITY_OPTIONS,
  INTERNSHIP_LINK_TYPES,
  isSafeHttpUrl,
  validateInternshipForm,
  validateInternshipLinkInput,
} from "../../utils/internshipsValidation";

const INITIAL_FORM = {
  role_title: "",
  organization_name: "",
  employment_type: "Internship",
  work_mode: "Hybrid",
  location: "",
  start_date: "",
  end_date: "",
  currently_working: false,
  description: "",
  responsibilities: "",
  achievements: "",
  company_website: "",
  visibility: "Public",
  status: "Active",
};

const toDateInput = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const InternshipsSection = ({
  studentId = null,
  role = "Student",
  canEdit = true,
  onUpdated = null,
  compact = false,
}) => {
  const isSelfMode = !studentId && role === "Student";
  const baseEndpoint = isSelfMode
    ? "/internships/me"
    : `/internships/student/${studentId}`;
  const projectsEndpoint = isSelfMode
    ? "/projects/me?limit=50"
    : `/projects/student/${studentId}?limit=50`;

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState("");
  const [sortMode, setSortMode] = useState("display_order");
  const [searchTerm, setSearchTerm] = useState("");

  // Add/Edit modal state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [expLinks, setExpLinks] = useState([]);
  const [newLink, setNewLink] = useState({ link_type: "VERIFICATION_PAGE", url: "", label: "" });
  const [linkError, setLinkError] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [skillOptions, setSkillOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadInternships = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (workModeFilter) params.set("work_mode", workModeFilter);
      if (sortMode) params.set("sort", sortMode);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const { data } = await customFetch.get(`${baseEndpoint}?${params.toString()}`);
      setInternships(data.internships || []);
    } catch (error) {
      setErrorMsg(error?.response?.data?.msg || "Failed to load internship experiences");
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, statusFilter, workModeFilter, sortMode, searchTerm]);

  useEffect(() => {
    loadInternships();
  }, [loadInternships]);

  useEffect(() => {
    if (!showForm) return;
    const loadRelations = async () => {
      try {
        const [skillsRes, projRes] = await Promise.all([
          customFetch.get(`/skills/master?q=${encodeURIComponent(skillQuery)}&limit=20`),
          customFetch.get(projectsEndpoint),
        ]);
        setSkillOptions(skillsRes.data?.skills || []);
        setProjectOptions(projRes.data?.projects || []);
      } catch {
        // non-blocking
      }
    };
    loadRelations();
  }, [showForm, skillQuery, projectsEndpoint]);

  useEffect(() => {
    if (!showForm) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowForm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showForm]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setSelectedSkills([]);
    setSelectedProjects([]);
    setExpLinks([]);
    setNewLink({ link_type: "VERIFICATION_PAGE", url: "", label: "" });
    setLinkError("");
    setFormErrors({});
    setShowForm(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      role_title: item.role_title || "",
      organization_name: item.organization_name || "",
      employment_type: item.employment_type || "Internship",
      work_mode: item.work_mode || "Hybrid",
      location: item.location || "",
      start_date: toDateInput(item.start_date),
      end_date: item.currently_working ? "" : toDateInput(item.end_date),
      currently_working: Boolean(item.currently_working),
      description: item.description || "",
      responsibilities: item.responsibilities || "",
      achievements: item.achievements || "",
      company_website: item.company_website || "",
      visibility: item.visibility || "Public",
      status: item.status || "Active",
    });
    setSelectedSkills(item.skills || []);
    setSelectedProjects(item.projects || []);
    setExpLinks(item.links || []);
    setNewLink({ link_type: "VERIFICATION_PAGE", url: "", label: "" });
    setLinkError("");
    setFormErrors({});
    setShowForm(true);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "currently_working" && value) {
        next.end_date = "";
      }
      return next;
    });
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddLink = () => {
    const errs = validateInternshipLinkInput(newLink, expLinks);
    if (errs.url || errs.link_type || errs.label) {
      setLinkError(errs.url || errs.link_type || errs.label);
      return;
    }
    setExpLinks((prev) => [
      ...prev,
      {
        link_type: newLink.link_type,
        url: newLink.url.trim(),
        label: newLink.label.trim(),
      },
    ]);
    setNewLink({ link_type: "VERIFICATION_PAGE", url: "", label: "" });
    setLinkError("");
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) => {
      const exists = prev.some((s) => s.id === skill.id);
      if (exists) return prev.filter((s) => s.id !== skill.id);
      return [...prev, skill];
    });
  };

  const toggleProject = (proj) => {
    setSelectedProjects((prev) => {
      const exists = prev.some((p) => p.id === proj.id);
      if (exists) return prev.filter((p) => p.id !== proj.id);
      return [...prev, proj];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateInternshipForm(formData);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      toast.error("Please fix the highlighted internship fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        role_title: formData.role_title.trim(),
        organization_name: formData.organization_name.trim(),
        employment_type: formData.employment_type,
        work_mode: formData.work_mode,
        location: formData.location.trim(),
        start_date: formData.start_date,
        end_date: formData.currently_working ? null : formData.end_date,
        currently_working: Boolean(formData.currently_working),
        description: formData.description.trim(),
        responsibilities: formData.responsibilities.trim(),
        achievements: formData.achievements.trim(),
        company_website: formData.company_website.trim(),
        visibility: formData.visibility,
        status: formData.status,
        links: expLinks,
        skill_ids: selectedSkills.map((s) => s.id),
        project_ids: selectedProjects.map((p) => p.id),
      };

      if (editingId) {
        await customFetch.patch(`${baseEndpoint}/${editingId}`, payload);
        toast.success("Internship experience updated");
      } else {
        await customFetch.post(baseEndpoint, payload);
        toast.success("Internship experience added");
      }

      setShowForm(false);
      await loadInternships();
      if (onUpdated) onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to save internship experience");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (internshipId) => {
    try {
      await customFetch.delete(`${baseEndpoint}/${internshipId}`);
      toast.success("Internship experience deleted");
      setConfirmDeleteId(null);
      await loadInternships();
      if (onUpdated) onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to delete internship experience");
    }
  };

  const handleToggleArchive = async (item) => {
    const nextStatus = item.status === "Archived" ? "Active" : "Archived";
    try {
      await customFetch.patch(`${baseEndpoint}/${item.id}`, { status: nextStatus });
      toast.success(`Internship ${nextStatus === "Archived" ? "archived" : "restored"}`);
      await loadInternships();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update status");
    }
  };

  const handleMove = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= internships.length) return;
    const reordered = [...internships];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setInternships(reordered);

    try {
      const orders = reordered.map((it, idx) => ({
        internship_id: it.id,
        display_order: idx,
      }));
      await customFetch.patch(`${baseEndpoint}/reorder`, { orders });
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to save internship order");
      loadInternships();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FiBriefcase className="text-[#3730a3]" />
            Internship &amp; Work Experience
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#3730a3]">
              {internships.length}
            </span>
          </h3>
          {!compact && (
            <p className="text-xs text-slate-500 mt-0.5">
              Document internships and industry experience linked with verified profile skills and projects.
            </p>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#3730a3] hover:bg-[#2d268c] text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Add Internship
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative">
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search role, company, location..."
            aria-label="Search internships"
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#3730a3]"
          />
        </div>
        <select
          value={workModeFilter}
          onChange={(e) => setWorkModeFilter(e.target.value)}
          aria-label="Filter by work mode"
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#3730a3]"
        >
          <option value="">All Work Modes</option>
          {WORK_MODE_OPTIONS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#3730a3]"
        >
          <option value="">All Statuses</option>
          {INTERNSHIP_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          aria-label="Sort internships"
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#3730a3]"
        >
          <option value="display_order">Manual Order</option>
          <option value="timeline">Timeline (Newest First)</option>
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
            onClick={loadInternships}
            className="px-3 py-1 rounded-lg bg-white border border-red-200 font-bold hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : internships.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-[#3730a3] flex items-center justify-center mb-3">
            <FiBriefcase className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No internship experiences added yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Add your internships, industry roles, linked technical skills, and key achievements.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {internships.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-indigo-200 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">{item.role_title}</h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#3730a3]">
                      {item.employment_type}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.work_mode}
                    </span>
                    {item.currently_working && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Currently Working
                      </span>
                    )}
                    {item.status === "Archived" && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        Archived
                      </span>
                    )}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {item.visibility}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700">{item.organization_name}</p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                    <span>
                      {toDateInput(item.start_date)} —{" "}
                      {item.currently_working ? "Present" : toDateInput(item.end_date)}
                    </span>
                    {item.location && (
                      <span className="inline-flex items-center gap-1">
                        <FiMapPin className="w-3 h-3" />
                        {item.location}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-600 pt-1 leading-relaxed">{item.description}</p>
                  )}
                  {item.responsibilities && (
                    <p className="text-xs text-slate-600">
                      <span className="font-bold text-slate-700">Responsibilities: </span>
                      {item.responsibilities}
                    </p>
                  )}
                  {item.achievements && (
                    <p className="text-xs text-slate-600">
                      <span className="font-bold text-slate-700">Achievements: </span>
                      {item.achievements}
                    </p>
                  )}

                  {item.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.skills.map((sk) => (
                        <span
                          key={sk.id}
                          className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50/70 text-[#3730a3]"
                        >
                          {sk.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.projects?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-600">
                      <span className="font-bold">Related Projects:</span>
                      {item.projects.map((p) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold text-slate-700"
                        >
                          {p.title}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {isSafeHttpUrl(item.company_website) && (
                      <a
                        href={item.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        <FiExternalLink className="w-3 h-3" />
                        Company Website
                      </a>
                    )}
                    {(item.links || [])
                      .filter((l) => isSafeHttpUrl(l.url))
                      .map((l, lIdx) => (
                        <a
                          key={`${l.url}-${lIdx}`}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] text-xs font-bold"
                        >
                          <FiLink className="w-3 h-3" />
                          {l.label || l.link_type}
                        </a>
                      ))}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0 || sortMode !== "display_order"}
                      title="Move up"
                      aria-label="Move internship up"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <FiArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === internships.length - 1 || sortMode !== "display_order"}
                      title="Move down"
                      aria-label="Move internship down"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <FiArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(item)}
                      title={item.status === "Archived" ? "Restore" : "Archive"}
                      aria-label="Toggle archive"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      <FiArchive className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      title="Edit"
                      aria-label="Edit internship"
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      title="Delete"
                      aria-label="Delete internship"
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {confirmDeleteId === item.id && (
                <div className="mt-3 pt-3 border-t border-red-100 flex flex-wrap items-center justify-between gap-2 bg-red-50/70 p-2.5 rounded-xl">
                  <span className="text-xs font-bold text-red-800">
                    Delete &ldquo;{item.role_title}&rdquo; at {item.organization_name}?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? "Edit Internship Experience" : "Add Internship Experience"}
        >
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingId ? "Edit Internship Experience" : "Add Internship Experience"}
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
                  <label htmlFor="int-role" className="block text-xs font-bold text-slate-700 mb-1">
                    Role / Job Title *
                  </label>
                  <input
                    id="int-role"
                    type="text"
                    value={formData.role_title}
                    onChange={(e) => handleFieldChange("role_title", e.target.value)}
                    placeholder="e.g., Full Stack Intern"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#3730a3]"
                  />
                  {formErrors.role_title && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.role_title}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="int-org" className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Organization *
                  </label>
                  <input
                    id="int-org"
                    type="text"
                    value={formData.organization_name}
                    onChange={(e) => handleFieldChange("organization_name", e.target.value)}
                    placeholder="e.g., Tech Creature Solution"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#3730a3]"
                  />
                  {formErrors.organization_name && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.organization_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="int-emp-type" className="block text-xs font-bold text-slate-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    id="int-emp-type"
                    value={formData.employment_type}
                    onChange={(e) => handleFieldChange("employment_type", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    {EMPLOYMENT_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="int-work-mode" className="block text-xs font-bold text-slate-700 mb-1">
                    Work Mode
                  </label>
                  <select
                    id="int-work-mode"
                    value={formData.work_mode}
                    onChange={(e) => handleFieldChange("work_mode", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    {WORK_MODE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="int-location" className="block text-xs font-bold text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    id="int-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleFieldChange("location", e.target.value)}
                    placeholder="e.g., Ahmedabad, India"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label htmlFor="int-website" className="block text-xs font-bold text-slate-700 mb-1">
                    Company Website
                  </label>
                  <input
                    id="int-website"
                    type="url"
                    value={formData.company_website}
                    onChange={(e) => handleFieldChange("company_website", e.target.value)}
                    placeholder="https://company.example.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                  {formErrors.company_website && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.company_website}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="int-start" className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    id="int-start"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleFieldChange("start_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                  {formErrors.start_date && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.start_date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="int-end" className="block text-xs font-bold text-slate-700 mb-1">
                    End Date {!formData.currently_working && "*"}
                  </label>
                  <input
                    id="int-end"
                    type="date"
                    disabled={formData.currently_working}
                    value={formData.currently_working ? "" : formData.end_date}
                    onChange={(e) => handleFieldChange("end_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl disabled:bg-slate-100"
                  />
                  {formErrors.end_date && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.end_date}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.currently_working}
                      onChange={(e) => handleFieldChange("currently_working", e.target.checked)}
                      className="rounded border-slate-300 text-[#3730a3]"
                    />
                    I am currently working in this role
                  </label>
                </div>

                <div>
                  <label htmlFor="int-visibility" className="block text-xs font-bold text-slate-700 mb-1">
                    Visibility
                  </label>
                  <select
                    id="int-visibility"
                    value={formData.visibility}
                    onChange={(e) => handleFieldChange("visibility", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    {INTERNSHIP_VISIBILITY_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="int-status" className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    id="int-status"
                    value={formData.status}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    {INTERNSHIP_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="int-desc" className="block text-xs font-bold text-slate-700 mb-1">
                    Summary Description
                  </label>
                  <textarea
                    id="int-desc"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label htmlFor="int-resp" className="block text-xs font-bold text-slate-700 mb-1">
                    Key Responsibilities
                  </label>
                  <textarea
                    id="int-resp"
                    rows={2}
                    value={formData.responsibilities}
                    onChange={(e) => handleFieldChange("responsibilities", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label htmlFor="int-ach" className="block text-xs font-bold text-slate-700 mb-1">
                    Achievements / Impact
                  </label>
                  <textarea
                    id="int-ach"
                    rows={2}
                    value={formData.achievements}
                    onChange={(e) => handleFieldChange("achievements", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                {/* Canonical Skills Selector (S1-02) */}
                <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Skills Demonstrated (Canonical Skills)
                  </label>
                  <input
                    type="text"
                    value={skillQuery}
                    onChange={(e) => setSkillQuery(e.target.value)}
                    placeholder="Filter canonical skills..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl mb-2"
                  />
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {skillOptions.map((sk) => {
                      const active = selectedSkills.some((s) => s.id === sk.id);
                      return (
                        <button
                          key={sk.id}
                          type="button"
                          onClick={() => toggleSkill(sk)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                            active
                              ? "bg-[#3730a3] text-white border-[#3730a3]"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {sk.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Owned Projects Selector (S1-04) */}
                {projectOptions.length > 0 && (
                  <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Related Projects (S1-04 Portfolio)
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {projectOptions.map((proj) => {
                        const active = selectedProjects.some((p) => p.id === proj.id);
                        return (
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => toggleProject(proj)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              active
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {proj.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* External Links */}
                <div className="sm:col-span-2 border-t border-slate-100 pt-3 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Experience External Links
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <select
                      value={newLink.link_type}
                      onChange={(e) => setNewLink((p) => ({ ...p, link_type: e.target.value }))}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                    >
                      {INTERNSHIP_LINK_TYPES.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="url"
                      value={newLink.url}
                      onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))}
                      placeholder="https://..."
                      className="sm:col-span-2 px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 text-[#3730a3] text-xs font-extrabold hover:bg-indigo-100"
                    >
                      Add Link
                    </button>
                  </div>
                  {linkError && <p className="text-[11px] text-red-600">{linkError}</p>}
                  {expLinks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {expLinks.map((l, idx) => (
                        <span
                          key={`${l.url}-${idx}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700"
                        >
                          {l.label || l.link_type}: {l.url}
                          <button
                            type="button"
                            onClick={() =>
                              setExpLinks((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="Remove link"
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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
                  {saving ? "Saving..." : editingId ? "Update Internship" : "Save Internship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipsSection;
