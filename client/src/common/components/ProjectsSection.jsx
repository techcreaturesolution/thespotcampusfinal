import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FiLayers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiArrowUp,
  FiArrowDown,
  FiX,
  FiSearch,
  FiAlertCircle,
  FiGithub,
  FiLink,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "./Loading";
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_VISIBILITY_OPTIONS,
  PROJECT_LINK_TYPES,
  isSafeHttpUrl,
  validateProjectForm,
  validateProjectLinkInput,
} from "../../utils/projectsValidation";

const INITIAL_PROJECT_FORM = {
  title: "",
  description: "",
  role: "",
  status: "Completed",
  visibility: "Public",
  is_ongoing: false,
  start_date: "",
  end_date: "",
  team_size: "1",
  project_url: "",
  repository_url: "",
  live_demo_url: "",
};

const STATUS_BADGE = {
  Planned: "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Archived: "bg-slate-200 text-slate-600 border-slate-300",
};

const toDateInput = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const ProjectsSection = ({
  studentId = null,
  role = "Student",
  canEdit = true,
  onUpdated = null,
  compact = false,
}) => {
  const isSelfMode = !studentId && role === "Student";
  const baseEndpoint = isSelfMode ? "/projects/me" : `/projects/student/${studentId}`;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Add/Edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_PROJECT_FORM);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [projectLinks, setProjectLinks] = useState([]);
  const [newLink, setNewLink] = useState({ link_type: "GITHUB_REPOSITORY", url: "", label: "" });
  const [newLinkErrors, setNewLinkErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Skill search autocomplete inside project modal
  const [skillQuery, setSkillQuery] = useState("");
  const [skillResults, setSkillResults] = useState([]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "50");
      const { data } = await customFetch.get(`${baseEndpoint}?${params.toString()}`);
      setProjects(data.projects || []);
    } catch (error) {
      setErrorMsg(error?.response?.data?.msg || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, statusFilter]);

  useEffect(() => {
    if (!isSelfMode && !studentId) return;
    fetchProjects();
  }, [fetchProjects, isSelfMode, studentId]);

  useEffect(() => {
    if (!showForm) return;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: "15" });
        if (skillQuery.trim()) params.set("q", skillQuery.trim());
        const { data } = await customFetch.get(`/skills/master?${params.toString()}`);
        setSkillResults(data.skills || []);
      } catch {
        setSkillResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [showForm, skillQuery]);

  const openCreate = () => {
    setEditingProjectId(null);
    setFormData(INITIAL_PROJECT_FORM);
    setSelectedSkills([]);
    setProjectLinks([]);
    setNewLink({ link_type: "GITHUB_REPOSITORY", url: "", label: "" });
    setNewLinkErrors({});
    setSkillQuery("");
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (proj) => {
    setEditingProjectId(proj.id);
    setFormData({
      title: proj.title || "",
      description: proj.description || "",
      role: proj.role || "",
      status: proj.status || "Completed",
      visibility: proj.visibility || "Public",
      is_ongoing: Boolean(proj.is_ongoing),
      start_date: toDateInput(proj.start_date),
      end_date: toDateInput(proj.end_date),
      team_size: String(proj.team_size ?? 1),
      project_url: "",
      repository_url: "",
      live_demo_url: "",
    });
    const normalizedLinks = (proj.links && proj.links.length > 0)
      ? proj.links.map((l) => ({ link_type: l.link_type, url: l.url, label: l.label || "" }))
      : [
          ...(proj.repository_url ? [{ link_type: "GITHUB_REPOSITORY", url: proj.repository_url, label: "GitHub Repository" }] : []),
          ...(proj.live_demo_url ? [{ link_type: "LIVE_DEMO", url: proj.live_demo_url, label: "Live Demo" }] : []),
          ...(proj.project_url ? [{ link_type: "PROJECT_WEBSITE", url: proj.project_url, label: "Project Website" }] : []),
        ];
    setProjectLinks(normalizedLinks);
    setNewLink({ link_type: "LIVE_DEMO", url: "", label: "" });
    setNewLinkErrors({});
    setSelectedSkills(proj.skills || []);
    setSkillQuery("");
    setFormErrors({});
    setShowForm(true);
  };

  const handleAddLinkToDraft = () => {
    const errs = validateProjectLinkInput(newLink, projectLinks);
    if (Object.keys(errs).length > 0) {
      setNewLinkErrors(errs);
      return;
    }
    const meta = PROJECT_LINK_TYPES.find((t) => t.code === newLink.link_type);
    setProjectLinks((prev) => [
      ...prev,
      {
        link_type: newLink.link_type,
        url: newLink.url.trim(),
        label: newLink.label.trim() || meta?.label || "",
      },
    ]);
    setNewLink({ link_type: "LIVE_DEMO", url: "", label: "" });
    setNewLinkErrors({});
  };

  const handleRemoveLinkFromDraft = (idx) => {
    setProjectLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleSkill = (skill) => {
    const exists = selectedSkills.some((s) => String(s.id) === String(skill.id));
    if (exists) {
      setSelectedSkills((prev) => prev.filter((s) => String(s.id) !== String(skill.id)));
    } else {
      setSelectedSkills((prev) => [...prev, skill]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validateProjectForm(formData);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      toast.error("Please fix the validation errors");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        role: formData.role.trim(),
        status: formData.status,
        visibility: formData.visibility,
        is_ongoing: Boolean(formData.is_ongoing),
        start_date: formData.start_date || null,
        end_date: formData.is_ongoing ? null : formData.end_date || null,
        team_size: formData.team_size ? Number(formData.team_size) : 1,
        links: projectLinks,
        skill_ids: selectedSkills.map((s) => s.id),
      };

      if (editingProjectId) {
        await customFetch.patch(`${baseEndpoint}/${editingProjectId}`, payload);
        toast.success("Project updated successfully");
      } else {
        await customFetch.post(baseEndpoint, payload);
        toast.success("Project created successfully");
      }

      setShowForm(false);
      setEditingProjectId(null);
      await fetchProjects();
      if (onUpdated) await onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (proj) => {
    if (!window.confirm(`Remove project '${proj.title}'?`)) return;
    try {
      await customFetch.delete(`${baseEndpoint}/${proj.id}`);
      toast.success("Project removed");
      await fetchProjects();
      if (onUpdated) await onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to remove project");
    }
  };

  const handleMove = async (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= projects.length) return;
    const copy = [...projects];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setProjects(copy);

    try {
      const orders = copy.map((p, idx) => ({ project_id: p.id, display_order: idx }));
      const { data } = await customFetch.patch(`${baseEndpoint}/reorder`, { orders });
      setProjects(data.projects || copy);
      if (onUpdated) await onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to reorder projects");
      fetchProjects();
    }
  };

  if (loading) return <Loading />;

  if (errorMsg) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
        <FiAlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-bold text-rose-700">{errorMsg}</p>
        <button
          type="button"
          onClick={fetchProjects}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <FiLayers className="w-4 h-4 text-[#3730a3]" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Projects ({projects.length})
              </h3>
              <p className="text-xs text-slate-500">
                Portfolio projects linked with canonical technical skills
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter projects by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Statuses</option>
              {PROJECT_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {canEdit && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#3730a3] hover:bg-[#2e288a] text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <FiPlus className="w-3.5 h-3.5" /> Add Project
              </button>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {showForm && (
            <form
              onSubmit={handleSave}
              className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-800">
                  {editingProjectId ? "Edit Project" : "Add New Project"}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label="Close project form"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="proj_title" className="text-xs font-bold text-slate-600 block mb-1">
                    Project Title *
                  </label>
                  <input
                    id="proj_title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                    required
                  />
                  {formErrors.title && <p className="text-xs text-rose-600 mt-1">{formErrors.title}</p>}
                </div>

                <div>
                  <label htmlFor="proj_role" className="text-xs font-bold text-slate-600 block mb-1">
                    Your Role
                  </label>
                  <input
                    id="proj_role"
                    type="text"
                    placeholder="e.g. Full Stack Developer, Team Lead"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  />
                  {formErrors.role && <p className="text-xs text-rose-600 mt-1">{formErrors.role}</p>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="proj_description" className="text-xs font-bold text-slate-600 block mb-1">
                    Description *
                  </label>
                  <textarea
                    id="proj_description"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                    required
                  />
                  {formErrors.description && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="proj_status" className="text-xs font-bold text-slate-600 block mb-1">
                    Status
                  </label>
                  <select
                    id="proj_status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  >
                    {PROJECT_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="proj_visibility" className="text-xs font-bold text-slate-600 block mb-1">
                    Visibility
                  </label>
                  <select
                    id="proj_visibility"
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  >
                    {PROJECT_VISIBILITY_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="proj_start_date" className="text-xs font-bold text-slate-600 block mb-1">
                    Start Date
                  </label>
                  <input
                    id="proj_start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="proj_end_date" className="text-xs font-bold text-slate-600">
                      End Date
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_ongoing}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_ongoing: e.target.checked,
                            end_date: e.target.checked ? "" : formData.end_date,
                          })
                        }
                      />
                      Ongoing project
                    </label>
                  </div>
                  <input
                    id="proj_end_date"
                    type="date"
                    disabled={formData.is_ongoing}
                    value={formData.is_ongoing ? "" : formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm disabled:bg-slate-100"
                  />
                  {formErrors.end_date && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.end_date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="proj_team_size" className="text-xs font-bold text-slate-600 block mb-1">
                    Team Size
                  </label>
                  <input
                    id="proj_team_size"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.team_size}
                    onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                  />
                  {formErrors.team_size && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.team_size}</p>
                  )}
                </div>

                {/* Typed Project & GitHub Links Manager */}
                <div className="md:col-span-2 p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      GitHub &amp; Project Links ({projectLinks.length})
                    </span>
                    <span className="text-[11px] text-slate-400">HTTPS required for GitHub/GitLab/Bitbucket</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                    <div className="sm:col-span-4">
                      <select
                        aria-label="Project link type"
                        value={newLink.link_type}
                        onChange={(e) => {
                          setNewLink({ ...newLink, link_type: e.target.value });
                          setNewLinkErrors({});
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                      >
                        {PROJECT_LINK_TYPES.map((lt) => (
                          <option key={lt.code} value={lt.code}>
                            {lt.label}
                          </option>
                        ))}
                      </select>
                      {newLinkErrors.link_type && (
                        <p className="text-[11px] text-rose-600 mt-1">{newLinkErrors.link_type}</p>
                      )}
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="url"
                        aria-label="Project link URL"
                        placeholder={
                          newLink.link_type === "GITHUB_REPOSITORY"
                            ? "https://github.com/owner/repo"
                            : "https://example.com"
                        }
                        value={newLink.url}
                        onChange={(e) => {
                          setNewLink({ ...newLink, url: e.target.value });
                          setNewLinkErrors((prev) => ({ ...prev, url: undefined }));
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                      {newLinkErrors.url && (
                        <p className="text-[11px] text-rose-600 mt-1">{newLinkErrors.url}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        aria-label="Optional link label"
                        placeholder="Label (opt.)"
                        value={newLink.label}
                        onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddLinkToDraft}
                        className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                      >
                        + Add Link
                      </button>
                    </div>
                  </div>

                  {projectLinks.length > 0 && (
                    <div className="space-y-1.5">
                      {projectLinks.map((lnk, i) => (
                        <div
                          key={`${lnk.link_type}-${i}`}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {lnk.link_type === "GITHUB_REPOSITORY" ? (
                              <FiGithub className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                            ) : (
                              <FiLink className="w-3.5 h-3.5 text-[#3730a3] shrink-0" />
                            )}
                            <span className="font-bold text-slate-700 shrink-0">
                              {lnk.label || PROJECT_LINK_TYPES.find((t) => t.code === lnk.link_type)?.label}:
                            </span>
                            <span className="text-slate-500 truncate">{lnk.url}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLinkFromDraft(i)}
                            className="text-rose-600 hover:text-rose-800 p-1"
                            aria-label="Remove link"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Canonical Technical Skills Picker */}
                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="proj_skill_search" className="text-xs font-bold text-slate-600 block">
                    Technologies / Canonical Skills Used
                  </label>
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSkills.map((sk) => (
                        <button
                          key={sk.id}
                          type="button"
                          onClick={() => toggleSkill(sk)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#3730a3] text-white"
                        >
                          {sk.name} <FiX className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <FiSearch className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="proj_skill_search"
                      type="text"
                      placeholder="Search canonical skills to link (e.g. React, MongoDB, Flutter)..."
                      value={skillQuery}
                      onChange={(e) => setSkillQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                    {skillResults.map((sk) => {
                      const active = selectedSkills.some((s) => String(s.id) === String(sk.id));
                      return (
                        <button
                          key={sk.id}
                          type="button"
                          onClick={() => toggleSkill(sk)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                            active
                              ? "bg-indigo-100 text-[#3730a3] border-indigo-300"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {active ? "✓ " : "+ "}
                          {sk.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#3730a3] text-white rounded-xl text-xs font-bold disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingProjectId ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          )}

          {projects.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-sm font-bold text-slate-700">No projects added yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Showcase academic, personal, or team projects with linked technologies and links.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <div
                  key={proj.id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-base text-slate-900">{proj.title}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            STATUS_BADGE[proj.status] || STATUS_BADGE.Completed
                          }`}
                        >
                          {proj.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                          {proj.visibility}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold">
                        {[
                          proj.role || null,
                          proj.team_size > 1 ? `Team of ${proj.team_size}` : "Solo Project",
                          proj.start_date
                            ? `${toDateInput(proj.start_date)} – ${
                                proj.is_ongoing ? "Ongoing" : toDateInput(proj.end_date) || "Present"
                              }`
                            : proj.is_ongoing
                              ? "Ongoing"
                              : null,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1.5 self-end sm:self-start">
                        {!statusFilter && (
                          <>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMove(idx, -1)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                              title="Move up"
                            >
                              <FiArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === projects.length - 1}
                              onClick={() => handleMove(idx, 1)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                              title="Move down"
                            >
                              <FiArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(proj)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                          title="Edit project"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(proj)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                          title="Delete project"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">{proj.description}</p>

                  {proj.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {proj.skills.map((sk) => (
                        <span
                          key={sk.id}
                          className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-[#3730a3] border border-indigo-100"
                        >
                          {sk.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-1">
                    {(proj.links && proj.links.length > 0
                      ? proj.links
                      : [
                          ...(proj.repository_url ? [{ id: "repo", link_type: "GITHUB_REPOSITORY", label: "GitHub Repository", url: proj.repository_url }] : []),
                          ...(proj.live_demo_url ? [{ id: "demo", link_type: "LIVE_DEMO", label: "Live Demo", url: proj.live_demo_url }] : []),
                          ...(proj.project_url ? [{ id: "site", link_type: "PROJECT_WEBSITE", label: "Project Link", url: proj.project_url }] : []),
                        ]
                    )
                      .filter((lnk) => isSafeHttpUrl(lnk.url))
                      .map((lnk) => (
                        <a
                          key={lnk.id || lnk.url}
                          href={lnk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            lnk.link_type === "GITHUB_REPOSITORY"
                              ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                              : "bg-slate-50 text-[#3730a3] border-slate-200 hover:bg-indigo-50"
                          }`}
                        >
                          {lnk.link_type === "GITHUB_REPOSITORY" && <FiGithub className="w-3.5 h-3.5" />}
                          {lnk.label || PROJECT_LINK_TYPES.find((t) => t.code === lnk.link_type)?.label || "External Link"}
                          <FiExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsSection;
