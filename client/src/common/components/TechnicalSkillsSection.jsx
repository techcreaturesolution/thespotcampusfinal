import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import {
  FiCpu,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiAlertCircle,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "./Loading";
import {
  SKILL_CATEGORY_OPTIONS,
  SKILL_PROFICIENCY_LEVELS,
  getProficiencyMeta,
  sortSkillsByProficiency,
  validateAddSkillForm,
  validateUpdateSkillForm,
} from "../../utils/technicalSkillsValidation";

const PROFICIENCY_BADGE_STYLES = {
  Beginner: "bg-slate-100 text-slate-700 border-slate-200",
  Intermediate: "bg-blue-50 text-blue-700 border-blue-200",
  Advanced: "bg-indigo-50 text-[#3730a3] border-indigo-200",
  Expert: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const TechnicalSkillsSection = ({
  studentId = null,
  role = "Student",
  canEdit = true,
  onUpdated = null,
  compact = false,
}) => {
  const isSelfMode = !studentId && role === "Student";
  const baseEndpoint = isSelfMode ? "/skills/me" : `/skills/student/${studentId}`;

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Autocomplete search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedMasterSkill, setSelectedMasterSkill] = useState(null);

  // Add skill form state
  const [proficiency, setProficiency] = useState("Intermediate");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [addErrors, setAddErrors] = useState({});
  const [savingAdd, setSavingAdd] = useState(false);

  // Edit existing skill state
  const [editingId, setEditingId] = useState(null);
  const [editProficiency, setEditProficiency] = useState("Intermediate");
  const [editYears, setEditYears] = useState("");
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Filter & sort existing list
  const [proficiencyLevels, setProficiencyLevels] = useState(SKILL_PROFICIENCY_LEVELS);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [proficiencyFilter, setProficiencyFilter] = useState("");
  const [sortMode, setSortMode] = useState("display_order");

  const searchWrapperRef = useRef(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [{ data }, profRes] = await Promise.all([
        customFetch.get(baseEndpoint),
        customFetch.get("/skills/proficiencies").catch(() => ({ data: null })),
      ]);
      setSkills(data.skills || []);
      if (profRes?.data?.proficiencies?.length) {
        setProficiencyLevels([...profRes.data.proficiencies].sort((a, b) => a.order - b.order));
      } else if (data?.proficiency_levels?.length) {
        setProficiencyLevels([...data.proficiency_levels].sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      setErrorMsg(error?.response?.data?.msg || "Failed to load technical skills");
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint]);

  useEffect(() => {
    if (!isSelfMode && !studentId) return;
    fetchSkills();
  }, [fetchSkills, isSelfMode, studentId]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Debounced server-side canonical skill search
  useEffect(() => {
    if (!canEdit) return;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set("q", searchTerm.trim());
        if (selectedCategory) params.set("category", selectedCategory);
        params.set("limit", "20");
        const { data } = await customFetch.get(`/skills/master?${params.toString()}`);
        setSearchResults(data.skills || []);
        setHighlightedIndex(-1);
      } catch (err) {
        setSearchError(err?.response?.data?.msg || "Failed to search skill catalog");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, canEdit]);

  const existingMasterIds = skills.map((s) => String(s.skill?.id));

  const handleSelectMasterSkill = (item) => {
    if (existingMasterIds.includes(String(item.id))) {
      toast.info(`${item.name} is already in your technical skills`);
      return;
    }
    setSelectedMasterSkill(item);
    setSearchTerm(item.name);
    setDropdownOpen(false);
    setAddErrors((prev) => ({ ...prev, skill_id: undefined }));
  };

  const handleAutocompleteKeyDown = (e) => {
    if (!dropdownOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setDropdownOpen(true);
      return;
    }
    if (!dropdownOpen || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectMasterSkill(searchResults[highlightedIndex]);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    const errors = validateAddSkillForm({
      skillId: selectedMasterSkill?.id,
      proficiency,
      yearsOfExperience,
      existingSkillIds: existingMasterIds,
    });
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    setSavingAdd(true);
    try {
      await customFetch.post(baseEndpoint, {
        skill_id: selectedMasterSkill.id,
        proficiency,
        years_of_experience: yearsOfExperience === "" ? null : Number(yearsOfExperience),
      });
      toast.success(`${selectedMasterSkill.name} added to technical skills`);
      setSelectedMasterSkill(null);
      setSearchTerm("");
      setYearsOfExperience("");
      setProficiency("Intermediate");
      setAddErrors({});
      await fetchSkills();
      if (onUpdated) await onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to add technical skill");
    } finally {
      setSavingAdd(false);
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditProficiency(entry.proficiency || "Intermediate");
    setEditYears(entry.years_of_experience ?? "");
    setEditErrors({});
  };

  const handleSaveEdit = async (userSkillId) => {
    const errors = validateUpdateSkillForm({
      proficiency: editProficiency,
      yearsOfExperience: editYears,
    });
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setSavingEdit(true);
    try {
      await customFetch.patch(`${baseEndpoint}/${userSkillId}`, {
        proficiency: editProficiency,
        years_of_experience: editYears === "" ? null : Number(editYears),
      });
      toast.success("Skill updated");
      setEditingId(null);
      await fetchSkills();
      if (onUpdated) await onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update skill");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemoveSkill = async (entry) => {
    if (!window.confirm(`Remove '${entry.skill?.name}' from technical skills?`)) return;
    try {
      await customFetch.delete(`${baseEndpoint}/${entry.id}`);
      toast.success("Skill removed");
      await fetchSkills();
      if (onUpdated) await onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to remove skill");
    }
  };

  const handleMoveSkill = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= skills.length) return;

    const reordered = [...skills];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const orders = reordered.map((item, idx) => ({
      user_skill_id: item.id,
      display_order: idx,
    }));

    setSkills(reordered);
    try {
      const { data } = await customFetch.patch(`${baseEndpoint}/reorder`, { orders });
      setSkills(data.skills || reordered);
      if (onUpdated) await onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to reorder skills");
      fetchSkills();
    }
  };

  const filteredByCategory = categoryFilter
    ? skills.filter((item) => item.skill?.category === categoryFilter)
    : skills;
  const filteredByProficiency = proficiencyFilter
    ? filteredByCategory.filter((item) => item.proficiency === proficiencyFilter)
    : filteredByCategory;
  const displayedSkills = sortSkillsByProficiency(filteredByProficiency, sortMode);
  const canReorder = !categoryFilter && !proficiencyFilter && sortMode === "display_order";

  if (loading) return <Loading />;

  if (errorMsg) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
        <FiAlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-bold text-rose-700">{errorMsg}</p>
        <button
          type="button"
          onClick={fetchSkills}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {/* Add Canonical Skill Card */}
      {canEdit && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FiCpu className="w-4 h-4 text-[#3730a3]" />
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Add Technical Skill
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Canonical catalog ({skills.length} added)
            </span>
          </div>

          <form onSubmit={handleAddSkill} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
            {/* Category pre-filter */}
            <div className="md:col-span-3 space-y-1">
              <label htmlFor="ts_category_filter" className="text-xs font-bold text-slate-500">
                Category Filter
              </label>
              <select
                id="ts_category_filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3730a3]"
              >
                <option value="">All Categories</option>
                {SKILL_CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Searchable Autocomplete */}
            <div className="md:col-span-4 space-y-1 relative" ref={searchWrapperRef}>
              <label htmlFor="ts_skill_search" className="text-xs font-bold text-slate-500">
                Search Skill *
              </label>
              <div className="relative">
                <FiSearch className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="ts_skill_search"
                  type="text"
                  role="combobox"
                  aria-expanded={dropdownOpen}
                  aria-autocomplete="list"
                  placeholder="Type e.g. React, Python, SQL..."
                  value={searchTerm}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedMasterSkill(null);
                    setDropdownOpen(true);
                  }}
                  onKeyDown={handleAutocompleteKeyDown}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3730a3]"
                />
              </div>

              {dropdownOpen && (
                <div
                  role="listbox"
                  className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100"
                >
                  {searchLoading ? (
                    <div className="p-3 text-xs text-slate-500">Searching skills...</div>
                  ) : searchError ? (
                    <div className="p-3 text-xs text-rose-600">{searchError}</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500">No matching canonical skills found</div>
                  ) : (
                    searchResults.map((item, idx) => {
                      const alreadyAdded = existingMasterIds.includes(String(item.id));
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={highlightedIndex === idx}
                          disabled={alreadyAdded}
                          onClick={() => handleSelectMasterSkill(item)}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                            highlightedIndex === idx ? "bg-indigo-50" : "hover:bg-slate-50"
                          } ${alreadyAdded ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div>
                            <span className="font-bold text-slate-800 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.category}</span>
                          </div>
                          {alreadyAdded && (
                            <span className="text-[10px] font-bold text-emerald-600">Added</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {addErrors.skill_id && (
                <p className="text-xs text-rose-600 font-semibold">{addErrors.skill_id}</p>
              )}
            </div>

            {/* Proficiency */}
            <div className="md:col-span-2 space-y-1">
              <label htmlFor="ts_proficiency" className="text-xs font-bold text-slate-500">
                Proficiency
              </label>
              <select
                id="ts_proficiency"
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value)}
                aria-label="Select proficiency level"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3730a3]"
              >
                {proficiencyLevels.map((lvl) => (
                  <option key={lvl.code} value={lvl.name}>
                    {lvl.order}. {lvl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div className="md:col-span-1 space-y-1">
              <label htmlFor="ts_years" className="text-xs font-bold text-slate-500">
                Yrs
              </label>
              <input
                id="ts_years"
                type="number"
                step="0.5"
                min="0"
                max="50"
                placeholder="1"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="w-full px-2.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3730a3]"
              />
              {addErrors.years_of_experience && (
                <p className="text-[11px] text-rose-600">{addErrors.years_of_experience}</p>
              )}
            </div>

            {/* Submit */}
            <div className="md:col-span-2 md:pt-5">
              <button
                type="submit"
                disabled={savingAdd}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#3730a3] hover:bg-[#2e288a] text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-60"
              >
                <FiPlus className="w-4 h-4" /> {savingAdd ? "Adding..." : "Add Skill"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Technical Skills List Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Technical Skills ({displayedSkills.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordered list of verified canonical technical skills
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter saved skills by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Categories</option>
              {SKILL_CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter saved skills by proficiency"
              value={proficiencyFilter}
              onChange={(e) => setProficiencyFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">All Proficiencies</option>
              {proficiencyLevels.map((lvl) => (
                <option key={lvl.code} value={lvl.name}>
                  {lvl.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort saved skills"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="display_order">Custom Order</option>
              <option value="proficiency_desc">Proficiency: High to Low</option>
              <option value="proficiency_asc">Proficiency: Low to High</option>
            </select>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {displayedSkills.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-sm font-bold text-slate-700">No technical skills added yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Search and select skills above to showcase your technical strengths.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedSkills.map((entry, idx) => {
                const isEditingRow = editingId === entry.id;
                const badgeClass =
                  PROFICIENCY_BADGE_STYLES[entry.proficiency] || PROFICIENCY_BADGE_STYLES.Intermediate;
                const profMeta = getProficiencyMeta(entry.proficiency, proficiencyLevels);
                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {entry.skill?.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                          {entry.skill?.category || "Other"}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeClass}`}
                          title={profMeta.description || entry.proficiency}
                        >
                          {entry.proficiency} (L{entry.proficiency_order || profMeta.order}/{proficiencyLevels.length})
                        </span>
                        {entry.years_of_experience !== null &&
                          entry.years_of_experience !== undefined && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              • {entry.years_of_experience} yr{entry.years_of_experience === 1 ? "" : "s"}
                            </span>
                          )}
                      </div>
                      {entry.skill?.is_active === false && (
                        <p className="text-[11px] text-amber-600 font-semibold">
                          Archived from active catalog (preserved on your profile)
                        </p>
                      )}
                    </div>

                    {isEditingRow ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          aria-label="Edit proficiency"
                          value={editProficiency}
                          onChange={(e) => setEditProficiency(e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                        >
                          {proficiencyLevels.map((lvl) => (
                            <option key={lvl.code} value={lvl.name}>
                              {lvl.order}. {lvl.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="50"
                          aria-label="Edit years of experience"
                          placeholder="Yrs"
                          value={editYears}
                          onChange={(e) => setEditYears(e.target.value)}
                          className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                        {editErrors.years_of_experience && (
                          <span className="text-[11px] text-rose-600">{editErrors.years_of_experience}</span>
                        )}
                        <button
                          type="button"
                          disabled={savingEdit}
                          onClick={() => handleSaveEdit(entry.id)}
                          className="p-2 rounded-lg bg-[#3730a3] text-white"
                          title="Save"
                        >
                          <FiSave className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600"
                          title="Cancel"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      canEdit && (
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          {canReorder && (
                            <>
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveSkill(idx, -1)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-30"
                                title="Move up"
                                aria-label={`Move ${entry.skill?.name} up`}
                              >
                                <FiArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === displayedSkills.length - 1}
                                onClick={() => handleMoveSkill(idx, 1)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-30"
                                title="Move down"
                                aria-label={`Move ${entry.skill?.name} down`}
                              >
                                <FiArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(entry)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                            title="Edit skill"
                            aria-label={`Edit ${entry.skill?.name}`}
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(entry)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600"
                            title="Remove skill"
                            aria-label={`Remove ${entry.skill?.name}`}
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicalSkillsSection;
