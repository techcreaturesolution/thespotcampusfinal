import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiSearch, FiFilter, FiBookmark, FiCheck, FiX, FiChevronRight } from "react-icons/fi";
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

  useEffect(() => { fetchQuestions(); }, [page, filters]);

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 10, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await customFetch.get(`/preparation/questions/previous-year?${params}`);
      setQuestions(data.questions); setTotal(data.total); setCompanies(data.companies || []); setYears(data.years || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const handleBookmark = async (qId) => {
    try {
      await customFetch.post("/preparation/bookmarks/toggle", { item_type: "question", item_id: qId });
      toast.success("Bookmark toggled");
    } catch {}
  };

  const handleAnswer = (idx) => {
    setUserAnswer(idx);
    setShowAnswer(true);
  };

  const totalPages = Math.ceil(total / 10);
  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Previous Year Papers" subtitle={`${total} questions from top companies`} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filters.company_name} onChange={(e) => { setFilters({ ...filters, company_name: e.target.value }); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">All Companies</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.year} onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">All Years</option>
          {years.sort((a, b) => b - a).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filters.difficulty} onChange={(e) => { setFilters({ ...filters, difficulty: e.target.value }); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">All Difficulty</option>
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
      </div>

      {/* Question Detail View */}
      {selectedQ ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              {selectedQ.company_name && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs mr-2">{selectedQ.company_name}</span>}
              {selectedQ.year && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{selectedQ.year}</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleBookmark(selectedQ._id)} className="text-yellow-500 hover:text-yellow-600"><FiBookmark size={18} /></button>
              <button onClick={() => { setSelectedQ(null); setUserAnswer(-1); setShowAnswer(false); }} className="text-gray-500 hover:text-gray-700 text-sm">Back to list</button>
            </div>
          </div>
          <p className="text-gray-800 font-medium mb-4">{selectedQ.question_text}</p>
          <div className="space-y-2 mb-4">
            {selectedQ.options.map((opt, idx) => (
              <button key={idx} onClick={() => !showAnswer && handleAnswer(idx)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition text-sm ${showAnswer
                  ? idx === selectedQ.correct_option_index ? "border-green-400 bg-green-50 text-green-800" : idx === userAnswer && idx !== selectedQ.correct_option_index ? "border-red-400 bg-red-50 text-red-800" : "border-gray-200"
                  : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"}`}>
                <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span> {opt.text}
                {showAnswer && idx === selectedQ.correct_option_index && <FiCheck className="inline ml-2 text-green-600" />}
                {showAnswer && idx === userAnswer && idx !== selectedQ.correct_option_index && <FiX className="inline ml-2 text-red-600" />}
              </button>
            ))}
          </div>
          {showAnswer && selectedQ.explanation && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
              <p className="text-sm text-blue-700">{selectedQ.explanation}</p>
            </div>
          )}
        </div>
      ) : (
        /* Question List */
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q._id} onClick={() => { setSelectedQ(q); setUserAnswer(-1); setShowAnswer(false); }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-medium mb-2 line-clamp-2">{q.question_text}</p>
                  <div className="flex gap-2 flex-wrap">
                    {q.company_name && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{q.company_name}</span>}
                    {q.year && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{q.year}</span>}
                    <span className={`px-2 py-0.5 rounded text-xs ${q.difficulty === "easy" ? "bg-green-50 text-green-700" : q.difficulty === "hard" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>{q.difficulty}</span>
                  </div>
                </div>
                <FiChevronRight className="text-gray-400 mt-1" />
              </div>
            </div>
          ))}
          {questions.length === 0 && <p className="text-center text-gray-500 py-8">No questions found. Check back later!</p>}
        </div>
      )}

      {!selectedQ && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded text-sm bg-gray-100 disabled:opacity-50">Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded text-sm bg-gray-100 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
};

export default PreviousYearPapers;
