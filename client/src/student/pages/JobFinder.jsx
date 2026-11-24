import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  FiSearch, FiMapPin, FiBriefcase, FiDollarSign, FiClock,
  FiCheckCircle, FiExternalLink, FiFilter, FiMail, FiPhone,
  FiGlobe, FiRefreshCw, FiX, FiLayers, FiCalendar, FiChevronRight,
  FiAward, FiCompass, FiChevronDown, FiCheck
} from "react-icons/fi";
import { toast } from "react-toastify";
import customFetch from "../../utils/customFetch";
import PageHeader from "../../common/components/PageHeader";
import { CITIES_BY_STATE, ALL_CITIES, stateOfCity } from "../components/jobFinder/india";

const EXAMPLES = [
  "React Developer",
  "Graduate Trainee Engineer",
  "B.Com Accounts with Tally",
  "Telecaller Hindi / English",
  "Digital Marketing Intern",
  "Python Django Fresher",
  "Software Engineer Trainee",
];

const POSTED_OPTIONS = [
  { value: 1, label: "Last 24 Hours" },
  { value: 3, label: "Last 3 Days" },
  { value: 7, label: "Last 7 Days" },
  { value: 30, label: "Last 30 Days" },
  { value: 0, label: "Any time" },
];

const EMPTY_FORM = {
  level: "fresher",
  prompt: "",
  category: "",
  education: "",
  state: "",
  city: "",
  postedWithin: 30,
  verifiedOnly: false,
};

function formatPostedDate(postedAt, postedText) {
  if (postedAt) {
    const d = new Date(postedAt);
    if (!Number.isNaN(d.getTime())) {
      const days = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (days <= 0) return "Today";
      if (days === 1) return "Yesterday";
      return `${days} days ago`;
    }
  }
  return postedText || "Recently posted";
}

function cleanDescription(desc) {
  if (!desc) return "";
  if (!/<[a-z][\s\S]*>/i.test(desc)) return desc;
  try {
    const doc = new DOMParser().parseFromString(desc, "text/html");
    doc.querySelectorAll(".ql-ui, script, style").forEach((el) => el.remove());
    doc.querySelectorAll("li").forEach((li) => {
      li.textContent = `• ${li.textContent.trim()}\n`;
    });
    doc.querySelectorAll("p, div, br, h1, h2, h3, h4, h5, h6").forEach((el) => {
      el.after("\n");
    });
    return (doc.body.textContent || "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim();
  } catch {
    return desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}

// Custom downward-opening dropdown to avoid OS select popups opening upwards
const CustomDropdown = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  searchable = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedOptions = useMemo(() => {
    return options.map((opt) =>
      typeof opt === "object" ? opt : { value: opt, label: opt }
    );
  }, [options]);

  const selectedOption = normalizedOptions.find(
    (o) => String(o.value) === String(value)
  );

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return normalizedOptions;
    const q = search.toLowerCase();
    return normalizedOptions.filter((o) =>
      String(o.label).toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchable, search]);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setSearch("");
        }}
        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all duration-150 ${
          open
            ? "border-[#3730a3] ring-2 ring-[#3730a3]/20 bg-white"
            : "border-slate-200 hover:border-slate-300"
        } ${selectedOption?.value ? "text-slate-800" : "text-slate-500"}`}
      >
        <span className="truncate pr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#3730a3]" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 min-w-[210px]">
          {searchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/80">
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-2.5 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  autoFocus
                  placeholder={`Search ${label || "options"}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg outline-none focus:border-[#3730a3] placeholder-slate-400"
                />
              </div>
            </div>
          )}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400 font-bold">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-50 text-[#3730a3] font-extrabold"
                        : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && (
                      <FiCheck className="w-3.5 h-3.5 text-[#3730a3] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StudentJobFinder = () => {
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [history, setHistory] = useState([]);
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [currentSearch, setCurrentSearch] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // In-page results filters
  const [filterText, setFilterText] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterWithContact, setFilterWithContact] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await customFetch.get("/job-finder/searches");
      setHistory(data.items || []);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const { data } = await customFetch.get("/job-finder/meta");
        setMeta(data);
      } catch {
        toast.error("Failed to load search parameters");
      }
    };
    fetchMeta();
    loadHistory();
  }, [loadHistory]);

  // Polling if active search is running
  useEffect(() => {
    if (!activeSearchId) return;
    let isMounted = true;
    let pollTimer;
    let pollCount = 0;

    const checkSearch = async () => {
      try {
        pollCount += 1;
        const { data } = await customFetch.get(`/job-finder/searches/${activeSearchId}`);
        if (!isMounted) return;
        setCurrentSearch(data);

        if (data.search?.status === "running") {
          if (pollCount > 25) {
            // Stop polling after ~75s to prevent excessive background requests
            setSearching(false);
            return;
          }
          setSearching(true);
          pollTimer = setTimeout(checkSearch, 3000);
        } else {
          setSearching(false);
          loadHistory();
        }
      } catch {
        if (isMounted) {
          setSearching(false);
          toast.error("Failed to fetch live results");
        }
      }
    };

    checkSearch();
    return () => {
      isMounted = false;
      clearTimeout(pollTimer);
    };
  }, [activeSearchId, loadHistory]);

  const handleInputChange = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: field === "postedWithin" ? Number(val) : val };
      if (field === "state" && prev.city && stateOfCity(prev.city) && stateOfCity(prev.city) !== val) {
        next.city = "";
      }
      if (field === "city" && val && !prev.state) {
        next.state = stateOfCity(val);
      }
      return next;
    });
  };

  const handleStartSearch = async (e) => {
    if (e) e.preventDefault();
    if (!form.prompt.trim() && !form.category) {
      toast.warning("Please enter a job title or pick a category");
      return;
    }

    setSearching(true);
    setSelectedJob(null);
    try {
      const { data } = await customFetch.post("/job-finder/search", form);
      setActiveSearchId(data.search._id);
      setCurrentSearch({ search: data.search, items: [] });
      setFilterText("");
      setFilterPlatform("");
      setFilterWithContact(false);
    } catch (err) {
      setSearching(false);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Job search failed. Please try again.";
      toast.error(msg);
    }
  };

  const handleSelectHistory = (item) => {
    setActiveSearchId(item._id);
    setSelectedJob(null);
    setForm({
      ...EMPTY_FORM,
      level: item.level || "fresher",
      prompt: item.prompt || item.query || "",
      category: item.category || "",
      education: item.education || "",
      state: item.state || "",
      city: item.city || "",
      postedWithin: Number(item.postedWithin || 30),
      verifiedOnly: Boolean(item.verifiedOnly),
    });
  };

  // Direct Apply (Zero-Ads Guaranteed)
  const handleApply = async (job, directLink) => {
    try {
      const { data } = await customFetch.post(`/job-finder/jobs/${job._id}/apply`, directLink ? { link: directLink } : {});
      if (data.url) {
        if (data.url.startsWith("mailto:")) {
          window.location.href = data.url;
        } else {
          window.open(data.url, "_blank", "noopener,noreferrer");
        }
        return;
      }
    } catch {
      // Graceful fallback to direct url if endpoint fails or network hiccup occurs
    }

    const fallback = directLink || job.applyUrl || job.sourceUrl || job.companyWebsite;
    if (fallback) {
      if (fallback.startsWith("mailto:")) {
        window.location.href = fallback;
      } else {
        window.open(fallback, "_blank", "noopener,noreferrer");
      }
    } else {
      toast.error("Application link could not be opened");
    }
  };

  // Filtered in-page results (backend is single source of truth for date range)
  const filteredJobs = useMemo(() => {
    const rawItems = currentSearch?.items || [];
    if (!rawItems.length) return [];

    const query = filterText.toLowerCase().trim();

    const filtered = rawItems.filter((j) => {
      if (filterPlatform && j.platform !== filterPlatform) return false;
      if (filterWithContact && !j.emails?.length && !j.phones?.length) return false;
      if (
        query &&
        !`${j.title} ${j.companyName} ${j.location} ${j.city} ${j.state} ${j.description}`
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }
      return true;
    });

    if (sortBy === "newest") {
      return [...filtered].sort((a, b) => {
        const tA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const tB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return tB - tA;
      });
    }

    return filtered;
  }, [currentSearch, filterText, filterPlatform, filterWithContact, sortBy]);

  const availablePlatforms = useMemo(() => {
    return [...new Set((currentSearch?.items || []).map((j) => j.platform).filter(Boolean))].sort();
  }, [currentSearch]);

  const handleFieldSelect = (field) => (val) => {
    setForm((prev) => {
      const next = { ...prev, [field]: field === "postedWithin" ? Number(val) : val };
      if (field === "state" && prev.city && stateOfCity(prev.city) && stateOfCity(prev.city) !== val) {
        next.city = "";
      }
      if (field === "city" && val && !prev.state) {
        next.state = stateOfCity(val);
      }
      return next;
    });
  };

  const citiesForState = form.state ? CITIES_BY_STATE[form.state] || [] : ALL_CITIES;

  const stateOptions = useMemo(() => [
    { value: "", label: "All States across India" },
    ...(meta?.states || Object.keys(CITIES_BY_STATE)).map((st) => ({ value: st, label: st }))
  ], [meta]);

  const cityOptions = useMemo(() => [
    { value: "", label: "All Cities" },
    ...citiesForState.map((ct) => ({ value: ct, label: ct }))
  ], [citiesForState]);

  const categoryOptions = useMemo(() => [
    { value: "", label: "All Categories" },
    ...(meta?.categories || []).map((cat) => ({ value: cat.key, label: cat.label }))
  ], [meta]);

  const educationOptions = useMemo(() => [
    { value: "", label: "Any Qualification" },
    ...(meta?.education || []).map((edu) => ({ value: edu.key, label: edu.label }))
  ], [meta]);

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3 space-y-6">
      {/* Signature The Spot Campus Header */}
      <PageHeader
        icon={FiCompass}
        title="Market Job Finder"
        subtitle="Discover verified off-campus & corporate career openings across Google Jobs, LinkedIn, Indeed, Naukri & company career portals throughout India."
        badge={
          currentSearch?.items?.length
            ? `${currentSearch.items.length} opportunities`
            : "Off-Campus Aggregator"
        }
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold uppercase tracking-wide">
              <FiCheckCircle className="w-3.5 h-3.5" /> 100% Ad-Free Apply
            </span>
          </div>
        }
      />

      {/* Horizontal Search Criteria Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs border-t-4 border-t-[#3730a3]">
        <form onSubmit={handleStartSearch}>
          {/* Header & Experience Category Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FiFilter className="text-[#3730a3] w-4 h-4" />
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Search Criteria
              </h2>
              <span className="text-[11px] font-bold text-slate-400 ml-1.5 hidden sm:inline">
                All-India Live Aggregator
              </span>
            </div>

            {/* Fresher & Campus Focus Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/25 rounded-xl text-emerald-800 text-xs font-extrabold shadow-2xs self-start sm:self-auto">
              <FiAward className="w-3.5 h-3.5 text-emerald-600" />
              <span>Campus & Fresher Openings</span>
            </div>
          </div>

          {/* Primary Search Bar & Action Button */}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={form.prompt}
                onChange={handleInputChange("prompt")}
                placeholder={`Job Role, Skill or Designation (e.g. ${EXAMPLES[0]})`}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-[#3730a3]/30 focus:border-[#3730a3] outline-none transition-all duration-200 shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="vibrant-btn sm:w-auto px-7 py-2.5 text-white text-xs font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 disabled:opacity-50 shrink-0 shadow-sm"
            >
              {searching ? (
                <>
                  <FiRefreshCw className="animate-spin w-4 h-4" /> Scanning Openings...
                </>
              ) : (
                <>
                  <FiSearch className="w-4 h-4" /> Find Openings
                </>
              )}
            </button>
          </div>

          {/* Quick Suggestions Row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">
              Suggestions:
            </span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, prompt: ex }))}
                className="text-[10px] font-extrabold bg-indigo-50/70 text-[#3730a3] hover:bg-indigo-100/90 px-2.5 py-1 rounded-lg border border-indigo-100/80 transition-all duration-150"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Horizontal Filters Grid with Custom Downward Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
            {/* Indian State / UT */}
            <CustomDropdown
              label="Indian State / UT"
              value={form.state}
              onChange={handleFieldSelect("state")}
              options={stateOptions}
              placeholder="All States across India"
              searchable={true}
            />

            {/* Target City */}
            <CustomDropdown
              label="Target City"
              value={form.city}
              onChange={handleFieldSelect("city")}
              options={cityOptions}
              placeholder="All Cities"
              searchable={true}
            />

            {/* Industry / Category */}
            <CustomDropdown
              label="Industry / Category"
              value={form.category}
              onChange={handleFieldSelect("category")}
              options={categoryOptions}
              placeholder="All Categories"
              searchable={false}
            />

            {/* Minimum Qualification */}
            <CustomDropdown
              label="Minimum Qualification"
              value={form.education}
              onChange={handleFieldSelect("education")}
              options={educationOptions}
              placeholder="Any Qualification"
              searchable={false}
            />

            {/* Recency / Posted Within */}
            <CustomDropdown
              label="Recency / Posted Within"
              value={form.postedWithin}
              onChange={handleFieldSelect("postedWithin")}
              options={POSTED_OPTIONS}
              placeholder="Select range..."
              searchable={false}
            />
          </div>

          {/* Bottom Filter Controls: Verified Checkbox + Clear Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3 border-t border-slate-100">
            <label htmlFor="verifiedOnly" className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                id="verifiedOnly"
                checked={form.verifiedOnly}
                onChange={handleInputChange("verifiedOnly")}
                className="w-4 h-4 text-[#3730a3] rounded border-slate-300 focus:ring-[#3730a3] cursor-pointer"
              />
              <span>Show Verified Jobs Only (Live application URL tested & active)</span>
            </label>

            {(form.prompt || form.state || form.city || form.category || form.education) && (
              <button
                type="button"
                onClick={() => setForm({ ...EMPTY_FORM, level: form.level })}
                className="text-[11px] font-extrabold text-slate-500 hover:text-rose-600 transition"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Recent Searches Ribbon (Horizontal) */}
          {history.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <FiClock className="w-3 h-3" /> Recent:
              </span>
              {history.slice(0, 8).map((h) => (
                <button
                  key={h._id}
                  type="button"
                  onClick={() => handleSelectHistory(h)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all duration-150 flex items-center gap-1.5 ${
                    activeSearchId === h._id
                      ? "border-[#3730a3] bg-indigo-50 text-[#3730a3]"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <span>{h.prompt || h.query || "Category"}</span>
                  <span className="text-[9px] font-extrabold opacity-60">({h.resultCount || 0})</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Full-Width Results Section */}
      <div className="w-full space-y-5">
          {/* Active Search Summary & Filter Toolbar */}
          {currentSearch && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Results for "{currentSearch.search?.query || currentSearch.search?.prompt || "Search"}"
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                    Found {currentSearch.items?.length || 0} listings
                    {currentSearch.search?.durationMs ? ` in ${(currentSearch.search.durationMs / 1000).toFixed(1)}s` : ""}
                    {currentSearch.search?.providers?.length ? ` across ${currentSearch.search.providers.join(", ")}` : ""}
                  </p>
                </div>
                {searching && (
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#3730a3] bg-indigo-50 px-3 py-1.5 rounded-full self-start">
                    <FiRefreshCw className="animate-spin w-3.5 h-3.5" /> Gathering live feeds...
                  </div>
                )}
              </div>

              {/* In-page Results Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  placeholder="Filter results by skill, title..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-[#3730a3]/30 focus:border-[#3730a3] outline-none"
                />

                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/30 focus:border-[#3730a3] outline-none"
                >
                  <option value="">All Source Platforms</option>
                  {availablePlatforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterWithContact}
                      onChange={(e) => setFilterWithContact(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#3730a3] rounded border-slate-300 cursor-pointer"
                    />
                    <span>HR Contact Only</span>
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="newest">Newest First</option>
                    <option value="default">Relevance</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Searching Spinner */}
          {searching && (!currentSearch?.items || currentSearch.items.length === 0) && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#3730a3] flex items-center justify-center mx-auto shadow-sm">
                <FiRefreshCw className="animate-spin text-xl" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800">
                Aggregating Live Vacancies Across India...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crawling Google Jobs, LinkedIn, Indeed, and verified portals. Checking live apply links in real-time.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!searching && (!currentSearch || filteredJobs.length === 0) && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
              <div className="w-14 h-14 bg-indigo-50 text-[#3730a3] rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm">
                <FiBriefcase />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">
                {currentSearch ? "No jobs match your filter" : "Ready to discover off-campus jobs"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                {currentSearch
                  ? "Try relaxing keyword filters or searching for another city/category."
                  : "Set your search criteria above and discover corporate job postings tailored for you."}
              </p>
            </div>
          )}

          {/* Jobs List matching OpeningList theme (Responsive 3 columns on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between border-t-4 border-t-[#3730a3] shadow-xs group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#3730a3] transition-colors leading-snug truncate">
                        {job.title}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5 uppercase tracking-wide flex items-center gap-1 truncate">
                        <FiBriefcase className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        {job.companyName || "Confidential Organization"}
                      </p>
                    </div>

                    <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100/50 uppercase tracking-wide shrink-0">
                      {job.platform || "Direct"}
                    </span>
                  </div>

                  {/* Highlights Bar */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-slate-600 mb-2.5">
                    <span className="text-[#3730a3] font-extrabold">
                      Fresher
                    </span>
                    {job.salary && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-extrabold flex items-center gap-0.5">
                          <FiDollarSign className="w-3 h-3" /> {job.salary}
                        </span>
                      </>
                    )}
                    {job.verification?.status === "verified" && (
                      <>
                        <span>•</span>
                        <span className="text-blue-700 font-extrabold inline-flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3 text-blue-600" /> Verified
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description preview */}
                  {job.description && (
                    <div className="mb-3 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed max-h-20 overflow-y-auto">
                      {cleanDescription(job.description).slice(0, 180)}...
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold mb-3 border-t border-slate-100 pt-2.5">
                    {job.location && (
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <FiMapPin className="w-3 h-3" /> {job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" /> {formatPostedDate(job.postedAt, job.postedText)}
                    </span>
                    {job.workFromHome && (
                      <span className="text-emerald-600 font-extrabold">Remote</span>
                    )}
                  </div>
                </div>

                {/* Bottom Action CTAs */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="flex-1 py-2 px-3 text-xs font-extrabold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApply(job)}
                    className="vibrant-btn flex-1 py-2 px-3 text-white text-xs font-extrabold rounded-xl transition hover:opacity-95 active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Apply Now <FiExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Modern Details Drawer / Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
              <div className="flex-1 pr-4">
                <span className="inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                  {selectedJob.platform || "Direct Posting"}
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                  {selectedJob.title}
                </h2>
                <p className="text-xs font-bold text-slate-600 mt-0.5 flex items-center gap-1">
                  <FiBriefcase className="w-3.5 h-3.5 text-slate-400" />
                  {selectedJob.companyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/50 transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Location</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">{selectedJob.location || "India"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Salary</div>
                  <div className="font-extrabold text-emerald-700 mt-0.5">{selectedJob.salary || "Not Disclosed"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Experience</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">
                    {selectedJob.experienceText || selectedJob.level || "Any"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Education</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">
                    {selectedJob.educationText || selectedJob.education?.join(", ") || "Any"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Job Type</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">
                    {selectedJob.employmentType || "Full-time"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Posted Date</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">
                    {formatPostedDate(selectedJob.postedAt, selectedJob.postedText)}
                  </div>
                </div>
              </div>

              {/* Direct HR Contacts */}
              {(selectedJob.emails?.length > 0 || selectedJob.phones?.length > 0) && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                  <h4 className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
                    Direct HR Contacts Detected
                  </h4>
                  <div className="flex flex-wrap gap-3 font-bold text-amber-900">
                    {selectedJob.emails?.map((em) => (
                      <a key={em} href={`mailto:${em}`} className="flex items-center gap-1.5 hover:underline">
                        <FiMail className="text-amber-700 w-3.5 h-3.5" /> {em}
                      </a>
                    ))}
                    {selectedJob.phones?.map((ph) => (
                      <a key={ph} href={`tel:${ph}`} className="flex items-center gap-1.5 hover:underline">
                        <FiPhone className="text-amber-700 w-3.5 h-3.5" /> {ph}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Description */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 mb-2 uppercase tracking-wide">Job Description</h4>
                <div className="whitespace-pre-line text-slate-700 leading-relaxed bg-white border border-slate-200/80 p-4 rounded-2xl max-h-60 overflow-y-auto">
                  {cleanDescription(selectedJob.description) ||
                    "Full description was not provided. Please visit the official career link to view role requirements."}
                </div>
              </div>

              {/* Highlights */}
              {selectedJob.highlights?.map((hl) => (
                <div key={hl.title}>
                  <h4 className="text-xs font-extrabold text-slate-900 mb-1.5">{hl.title}</h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    {hl.items?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Multiple Apply Options */}
              {selectedJob.applyOptions?.length > 1 && (
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 mb-2">Available Application Channels</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.applyOptions.map((opt) => (
                      <button
                        key={opt.link}
                        type="button"
                        onClick={() => handleApply(selectedJob, opt.link)}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 hover:border-[#3730a3] hover:bg-indigo-50 text-[11px] font-bold text-slate-700 transition"
                      >
                        {opt.title || "Apply Link"} ↗
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
              {selectedJob.companyWebsite ? (
                <a
                  href={selectedJob.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#3730a3] hover:underline flex items-center gap-1"
                >
                  <FiGlobe className="w-3.5 h-3.5" /> Company Website ↗
                </a>
              ) : (
                <span className="text-[11px] font-bold text-slate-400">100% Ad-Free Apply</span>
              )}

              <button
                type="button"
                onClick={() => handleApply(selectedJob)}
                className="vibrant-btn py-2.5 px-6 rounded-xl text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 hover:opacity-95 active:scale-95"
              >
                Apply to Position <FiExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentJobFinder;
