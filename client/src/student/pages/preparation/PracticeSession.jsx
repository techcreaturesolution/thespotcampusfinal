import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiCheck, FiX, FiBookmark, FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";

const PracticeSession = () => {
  const { subjectId } = useParams();
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState(-1);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const subjectName = location.state?.subject?.name || "Practice";

  useEffect(() => {
    fetchQuestions();
  }, [subjectId, page]);

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
      const { data } = await customFetch.get(`/preparation/questions/practice/${subjectId}?page=${page}&limit=20`);
      setQuestions(data.questions);
    } catch {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx) => {
    if (showAnswer) return;
    setUserAnswer(idx);
    setShowAnswer(true);
    const isCorrect = idx === questions[currentIdx].correct_option_index;
    setStats((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      wrong: s.wrong + (isCorrect ? 0 : 1),
      total: s.total + 1,
    }));
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setUserAnswer(-1);
      setShowAnswer(false);
    } else if (questions.length === 20) {
      setPage((p) => p + 1);
      setCurrentIdx(0);
      setUserAnswer(-1);
      setShowAnswer(false);
      setLoading(true);
    }
  };

  const handleBookmark = async () => {
    const qId = questions[currentIdx]._id;
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
      toast.error("Failed to bookmark question");
    }
  };

  if (loading) return <Loading />;
  const currentQ = questions[currentIdx];
  if (!currentQ) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-slate-400 font-medium mb-4">No questions available for this subject yet.</p>
        <Link to="/dashboard/student/preparation/subjects" className="vibrant-btn inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md">
          <FiArrowLeft /> Back to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 text-left animate-fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <Link
          to="/dashboard/student/preparation/subjects"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-650 hover:text-indigo-800 transition-colors uppercase tracking-wider"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Subjects
        </Link>

        {/* Practice Stats Badge Row */}
        <div className="flex gap-2">
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <FiCheck className="w-3.5 h-3.5" /> {stats.correct} Correct
          </div>
          <div className="bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <FiX className="w-3.5 h-3.5" /> {stats.wrong} Wrong
          </div>
          <div className="bg-slate-50 text-slate-650 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
            Total: {stats.total}
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-6 transition-all duration-300">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              Q{(page - 1) * 20 + currentIdx + 1}
            </span>
            <span className="text-slate-400 text-xs font-semibold">
              in {subjectName}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                currentQ.difficulty === "easy"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : currentQ.difficulty === "hard"
                  ? "bg-rose-50 text-rose-700 border-rose-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
              }`}
            >
              {currentQ.difficulty}
            </span>
          </div>

          <button
            onClick={handleBookmark}
            title={bookmarkedIds.has(currentQ._id) ? "Remove Bookmark" : "Bookmark Question"}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors shadow-sm ${
              bookmarkedIds.has(currentQ._id)
                ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300"
                : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <FiBookmark className={`w-4 h-4 ${bookmarkedIds.has(currentQ._id) ? "fill-current" : "fill-none"}`} />
          </button>
        </div>

        {/* Question Text */}
        <h2 className="text-slate-800 text-base sm:text-lg font-bold mb-6 leading-relaxed">
          {currentQ.question_text}
        </h2>

        {/* Options Selection List */}
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isCorrectOption = idx === currentQ.correct_option_index;
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
                onClick={() => handleAnswer(idx)}
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

        {/* Explanation Alert */}
        {showAnswer && currentQ.explanation && (
          <div className="mt-6 bg-[#2563eb]/5 border border-[#2563eb]/10 rounded-2xl p-5 text-left animate-scale-in">
            <h4 className="text-xs font-black text-[#3730a3] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>💡</span> Explanation
            </h4>
            <p className="text-xs sm:text-sm text-slate-650 leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={() => {
            if (currentIdx > 0) {
              setCurrentIdx((i) => i - 1);
              setUserAnswer(-1);
              setShowAnswer(false);
            }
          }}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
        >
          <FiChevronLeft className="w-4 h-4" /> Previous
        </button>

        <button
          onClick={nextQuestion}
          className="vibrant-btn flex items-center gap-1.5 px-6 py-2.5 rounded-full text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          Next <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PracticeSession;

