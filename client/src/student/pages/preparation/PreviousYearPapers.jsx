import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiSearch, FiFilter, FiBookmark, FiCheck, FiX, FiChevronRight, FiChevronLeft, FiArrowLeft, FiClock, FiBriefcase } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const PreviousYearPapers = () => {
  const [questions, setQuestions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ company_name: "", year: "", difficulty: "" });
  const [selectedQ, setSelectedQ] = useState(null);
  const [userAnswer, setUserAnswer] = useState(-1);
  const [showAnswer, setShowAnswer] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  useEffect(() => {
    fetchQuestions();
  }, [page, filters]);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const { data } = await customFetch.get("/preparation/bookmarks?item_type=question");
      setBookmarkedIds(new Set(data.bookmarks.map(bm => bm.item_id)));
    } catch (err) {
      console.error("Failed to load bookmarks", err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      const { data } = await customFetch.get(`/preparation/questions/previous-year?${params}`);
      setQuestions(data.questions);
      setTotal(data.total);
      setCompanies(data.companies || []);
      setYears(data.years || []);
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

  const totalPages = Math.ceil(total / 10);
  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        title="Previous Year Papers"
        subtitle={`${total} company-specific questions with detailed solutions`}
      />

      {/* Filters Box */}
      {!selectedQ && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-wrap gap-4 items-center">
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
              value={filters.year}
              onChange={(e) => {
                setFilters({ ...filters, year: e.target.value });
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 outline-none transition-colors cursor-pointer"
            >
              <option value="">All Years</option>
              {years
                .sort((a, b) => b - a)
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
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
        <div className="space-y-4">
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
    </div>
  );
};

export default PreviousYearPapers;

