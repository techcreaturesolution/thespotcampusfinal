import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FiSearch, FiFilter, FiBookmark, FiCheck, FiX, FiChevronRight, FiChevronLeft, FiArrowLeft, FiClock, FiBriefcase } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const PreviousYearPapers = () => {
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [years, setYears] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  const [selectedYear, setSelectedYear] = useState(location.state?.year || null);
  const [selectedCategory, setSelectedCategory] = useState(location.state?.category || null);
  const [activeSubjectId, setActiveSubjectId] = useState(location.state?.subjectId || null);
  const [activeSubjectName, setActiveSubjectName] = useState(location.state?.subjectName || "");

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ company_name: "", difficulty: "" });
  const [selectedQ, setSelectedQ] = useState(null);
  const [userAnswer, setUserAnswer] = useState(-1);
  const [showAnswer, setShowAnswer] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [bookmarkedPyIds, setBookmarkedPyIds] = useState(new Set());

  // Sync state with location state when navigating from bookmarks page
  useEffect(() => {
    if (location.state) {
      if (location.state.year) setSelectedYear(location.state.year);
      if (location.state.category) setSelectedCategory(location.state.category);
      if (location.state.subjectId) setActiveSubjectId(location.state.subjectId);
      if (location.state.subjectName) setActiveSubjectName(location.state.subjectName);
    }
  }, [location.state]);

  // Fetch bookmarks and years on mount
  useEffect(() => {
    fetchBookmarks();
    fetchPyBookmarks();
    fetchYears();
  }, []);

  // Fetch categories when year is selected
  useEffect(() => {
    if (selectedYear) {
      fetchCategories(selectedYear);
    }
  }, [selectedYear]);

  // Fetch subjects when category is selected
  useEffect(() => {
    if (selectedYear && selectedCategory) {
      fetchSubjects(selectedYear, selectedCategory);
    }
  }, [selectedCategory]);

  // Fetch questions when subject is selected, page changes, or filters change
  useEffect(() => {
    if (selectedYear && selectedCategory && activeSubjectId) {
      fetchQuestions();
    }
  }, [page, filters, activeSubjectId]);

  const fetchPyBookmarks = async () => {
    try {
      const { data } = await customFetch.get("/preparation/bookmarks?item_type=previous_year");
      const keys = data.bookmarks.map(bm => `${bm.item_id}_${bm.notes}`);
      setBookmarkedPyIds(new Set(keys));
    } catch (err) {
      console.error("Failed to load previous year bookmarks", err);
    }
  };

  const handlePyBookmark = async (e, subjectId) => {
    e.stopPropagation();
    const key = `${subjectId}_${selectedYear}`;
    try {
      const { data } = await customFetch.post("/preparation/bookmarks/toggle", {
        item_type: "previous_year",
        item_id: subjectId,
        notes: String(selectedYear),
      });
      setBookmarkedPyIds(prev => {
        const next = new Set(prev);
        if (data.bookmarked) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
      toast.success(data.msg || "Bookmark toggled successfully");
    } catch {
      toast.error("Failed to toggle bookmark");
    }
  };

  const fetchBookmarks = async () => {
    try {
      const { data } = await customFetch.get("/preparation/bookmarks?item_type=question");
      setBookmarkedIds(new Set(data.bookmarks.map(bm => bm.item_id)));
    } catch (err) {
      console.error("Failed to load bookmarks", err);
    }
  };

  const fetchYears = async () => {
    try {
      setLoading(true);
      const { data } = await customFetch.get("/preparation/questions/previous-year");
      setYears(data.years || []);
    } catch {
      toast.error("Failed to load available years");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (year) => {
    try {
      setLoading(true);
      const { data } = await customFetch.get(`/preparation/questions/previous-year/categories?year=${year}`);
      setCategories(data.categories || []);
    } catch {
      toast.error("Failed to load categories for " + year);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (year, cat) => {
    try {
      setLoading(true);
      const { data } = await customFetch.get(`/preparation/questions/previous-year/subjects?year=${year}&category=${cat}`);
      setSubjectsList(data.subjects || []);
    } catch {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        year: selectedYear,
        category: selectedCategory,
        subject_id: activeSubjectId,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      const { data } = await customFetch.get(`/preparation/questions/previous-year?${params}`);
      setQuestions(data.questions);
      setTotal(data.total);
      setCompanies(data.companies || []);
    } catch {
      toast.error("Failed to load previous year questions");
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (qId) => {
    try {
      const { data } = await customFetch.post("/preparation/bookmarks/toggle", {
        item_type: "question",
        item_id: qId,
      });
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (data.bookmarked) {
          next.add(qId);
        } else {
          next.delete(qId);
        }
        return next;
      });
      toast.success(data.msg || "Bookmark toggled successfully");
    } catch {
      toast.error("Failed to toggle bookmark");
    }
  };

  const handleAnswer = (idx) => {
    setUserAnswer(idx);
    setShowAnswer(true);
  };

  const handleBreadcrumbClick = (stage) => {
    setSelectedQ(null);
    setUserAnswer(-1);
    setShowAnswer(false);
    
    if (stage === "year") {
      setSelectedYear(null);
      setSelectedCategory(null);
      setActiveSubjectId(null);
      setQuestions([]);
      setTotal(0);
      setPage(1);
    } else if (stage === "category") {
      setSelectedCategory(null);
      setActiveSubjectId(null);
      setQuestions([]);
      setTotal(0);
      setPage(1);
    } else if (stage === "subject") {
      setActiveSubjectId(null);
      setQuestions([]);
      setTotal(0);
      setPage(1);
    }
  };

  const totalPages = Math.ceil(total / 10);

  const renderYearsStage = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
      {years.sort((a, b) => b - a).map((y) => (
        <div
          key={y}
          onClick={() => {
            setSelectedYear(y);
            setPage(1);
          }}
          className="bg-white rounded-3xl border-2 border-slate-100 hover:border-[#3730a3] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-4 group relative overflow-hidden text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#3730a3] group-hover:bg-[#3730a3] group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-inner relative z-10">
            <FiClock className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-slate-900">{y} Papers</h3>
            <p className="text-[10px] text-slate-450 mt-1 uppercase font-black tracking-wider">Explore questions</p>
          </div>
        </div>
      ))}
      {years.length === 0 && (
        <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium">No previous year paper years found in the database.</p>
        </div>
      )}
    </div>
  );

  const renderCategoriesStage = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
      {categories.map((cat) => (
        <div
          key={cat}
          onClick={() => {
            setSelectedCategory(cat);
            setPage(1);
          }}
          className="bg-white rounded-3xl border-2 border-slate-100 hover:border-emerald-500 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-4 group relative overflow-hidden text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-inner relative z-10">
            <FiFilter className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-slate-900 capitalize">{cat}</h3>
            <p className="text-[10px] text-slate-450 mt-1 uppercase font-black tracking-wider">Select Category</p>
          </div>
        </div>
      ))}
      {categories.length === 0 && (
        <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium">No categories available for year {selectedYear}.</p>
        </div>
      )}
    </div>
  );

  const renderSubjectsStage = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
      {subjectsList.map((sub) => {
        const key = `${sub._id}_${selectedYear}`;
        const isBookmarked = bookmarkedPyIds.has(key);
        return (
          <div
            key={sub._id}
            onClick={() => {
              setActiveSubjectId(sub._id);
              setActiveSubjectName(sub.name);
              setPage(1);
            }}
            className="bg-white rounded-3xl border-2 border-slate-100 hover:border-amber-500 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-4 group relative overflow-hidden text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 to-orange-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={(e) => handlePyBookmark(e, sub._id)}
                title={isBookmarked ? "Remove Bookmark" : "Bookmark Paper"}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                  isBookmarked
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-650"
                }`}
              >
                <FiBookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : "fill-none"}`} />
              </button>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-inner relative z-10">
              <FiBookmark className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <h3 className="text-base font-black text-slate-800 tracking-tight group-hover:text-slate-900">{sub.name}</h3>
              <p className="text-[10px] text-slate-450 mt-1 uppercase font-black tracking-wider">Practice questions</p>
            </div>
          </div>
        );
      })}
      {subjectsList.length === 0 && (
        <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium">No subjects found in category {selectedCategory} for year {selectedYear}.</p>
        </div>
      )}
    </div>
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 text-left animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title={
            !selectedYear
              ? "Previous Year Papers"
              : !selectedCategory
              ? `${selectedYear} Papers`
              : !activeSubjectId
              ? `${selectedCategory} (${selectedYear})`
              : activeSubjectName
          }
          subtitle={
            !selectedYear
              ? "Select a year to explore previous year papers"
              : !selectedCategory
              ? `Select Category for ${selectedYear}`
              : !activeSubjectId
              ? `Select Subject under ${selectedCategory}`
              : `${total} company-specific questions with detailed solutions`
          }
        />
        
        {/* Navigation Breadcrumbs Trail */}
        {(selectedYear || selectedCategory || activeSubjectId) && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold text-slate-500 bg-white px-4 py-2.5 rounded-full border border-slate-200 shadow-sm animate-fade-in">
            <button 
              onClick={() => handleBreadcrumbClick("year")}
              className="hover:text-[#3730a3] transition-colors uppercase tracking-wider"
            >
              All Years
            </button>
            
            {selectedYear && (
              <>
                <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button 
                  onClick={() => handleBreadcrumbClick("category")}
                  className={`hover:text-[#3730a3] transition-colors ${!selectedCategory ? "text-[#3730a3]" : ""}`}
                >
                  {selectedYear}
                </button>
              </>
            )}

            {selectedCategory && (
              <>
                <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button 
                  onClick={() => handleBreadcrumbClick("subject")}
                  className={`hover:text-[#3730a3] transition-colors capitalize ${!activeSubjectId ? "text-[#3730a3]" : ""}`}
                >
                  {selectedCategory}
                </button>
              </>
            )}

            {activeSubjectId && (
              <>
                <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#3730a3] truncate max-w-[120px]">
                  {activeSubjectName}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stage Views */}
      {!selectedYear ? (
        renderYearsStage()
      ) : !selectedCategory ? (
        renderCategoriesStage()
      ) : !activeSubjectId ? (
        renderSubjectsStage()
      ) : (
        /* Stage 4: Question List or Question Details */
        <>
          {/* Filters Box */}
          {!selectedQ && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-wrap gap-4 items-center animate-fade-in">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-wider mr-2">
                <FiFilter className="w-4 h-4 text-[#3730a3]" /> Filter By:
              </div>
              
              <div className="flex flex-wrap gap-3 flex-1">
                <select
                  value={filters.company_name}
                  onChange={(e) => {
                    setFilters({ ...filters, company_name: e.target.value });
                    setPage(1);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 outline-none transition-colors cursor-pointer"
                >
                  <option value="">All Companies</option>
                  {companies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.difficulty}
                  onChange={(e) => {
                    setFilters({ ...filters, difficulty: e.target.value });
                    setPage(1);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 outline-none transition-colors cursor-pointer"
                >
                  <option value="">All Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          )}

          {/* Question Detail View */}
          {selectedQ ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm animate-scale-in">
              <div className="flex justify-between items-center gap-4 mb-6">
                <button
                  onClick={() => {
                    setSelectedQ(null);
                    setUserAnswer(-1);
                    setShowAnswer(false);
                  }}
                  className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-650 hover:text-indigo-800 transition-colors uppercase tracking-wider"
                >
                  <FiArrowLeft className="w-4 h-4" /> Back to list
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleBookmark(selectedQ._id)}
                    title={bookmarkedIds.has(selectedQ._id) ? "Remove Bookmark" : "Bookmark Question"}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors shadow-sm ${
                      bookmarkedIds.has(selectedQ._id)
                        ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300"
                        : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <FiBookmark className={`w-4 h-4 ${bookmarkedIds.has(selectedQ._id) ? "fill-current" : "fill-none"}`} />
                  </button>
                </div>
              </div>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {selectedQ.company_name && (
                  <span className="bg-[#2563eb]/5 text-[#2563eb] border border-[#2563eb]/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <FiBriefcase className="w-3 h-3" /> {selectedQ.company_name}
                  </span>
                )}
                {selectedQ.year && (
                  <span className="bg-slate-100 text-slate-650 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <FiClock className="w-3 h-3" /> {selectedQ.year}
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    selectedQ.difficulty === "easy"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : selectedQ.difficulty === "hard"
                      ? "bg-rose-50 text-rose-700 border-rose-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}
                >
                  {selectedQ.difficulty}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-slate-800 text-base sm:text-lg font-bold mb-6 leading-relaxed">
                {selectedQ.question_text}
              </h2>

              {/* Options Selection List */}
              <div className="space-y-3 mb-6">
                {selectedQ.options.map((opt, idx) => {
                  const isCorrectOption = idx === selectedQ.correct_option_index;
                  const isUserSelection = idx === userAnswer;

                  let optionStyle = "border-slate-250 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer text-slate-700";
                  if (showAnswer) {
                    if (isCorrectOption) {
                      optionStyle = "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold";
                    } else if (isUserSelection) {
                      optionStyle = "border-rose-400 bg-rose-50/70 text-rose-950 font-semibold";
                    } else {
                      optionStyle = "border-slate-200 text-slate-400 opacity-80";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => !showAnswer && handleAnswer(idx)}
                      disabled={showAnswer}
                      className={`w-full text-left px-5 py-4 rounded-2xl border transition-all text-sm flex items-center justify-between gap-3 ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-650 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt.text}</span>
                      </div>

                      {showAnswer && isCorrectOption && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm animate-scale-in">
                          <FiCheck className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {showAnswer && isUserSelection && !isCorrectOption && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm animate-scale-in">
                          <FiX className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {showAnswer && selectedQ.explanation && (
                <div className="bg-[#2563eb]/5 border border-[#2563eb]/10 rounded-2xl p-5 text-left animate-scale-in">
                  <h4 className="text-xs font-black text-[#3730a3] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>💡</span> Explanation
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-650 leading-relaxed">
                    {selectedQ.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Question List */
            <div className="space-y-4 animate-fade-in">
              {questions.map((q) => (
                <div
                  key={q._id}
                  onClick={() => {
                    setSelectedQ(q);
                    setUserAnswer(-1);
                    setShowAnswer(false);
                  }}
                  className="bg-white rounded-3xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex justify-between items-center gap-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-bold text-sm mb-3 line-clamp-2 leading-relaxed">
                      {q.question_text}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {q.company_name && (
                        <span className="bg-[#2563eb]/5 text-[#2563eb] border border-[#2563eb]/10 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <FiBriefcase className="w-2.5 h-2.5" /> {q.company_name}
                        </span>
                      )}
                      {q.year && (
                        <span className="bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <FiClock className="w-2.5 h-2.5" /> {q.year}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          q.difficulty === "easy"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : q.difficulty === "hard"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex-shrink-0">
                    <FiChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                  <p className="text-slate-400 font-medium">No previous year questions match the active filters.</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination Row */}
          {!selectedQ && totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PreviousYearPapers;
