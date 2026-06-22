import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiCheck, FiX, FiMinus, FiArrowLeft, FiAward, FiClock, FiTarget, FiActivity, FiEye } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";

const TestResult = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await customFetch.get(`/preparation/mock-tests/result/${attemptId}`);
        setAttempt(data.attempt);
        setQuestions(data.questions);
      } catch {
        toast.error("Failed to load test result details");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) return <Loading />;
  if (!attempt) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-slate-400 font-medium mb-4">Test result details could not be found.</p>
        <Link to="/dashboard/student/preparation/mock-tests" className="vibrant-btn inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md">
          <FiArrowLeft /> Back to Mock Tests
        </Link>
      </div>
    );
  }

  const passed = attempt.mock_test_id?.passing_percentage
    ? attempt.accuracy >= attempt.mock_test_id.passing_percentage
    : attempt.accuracy >= 40;

  return (
    <div className="max-w-3xl mx-auto py-4 text-left animate-fade-in">
      <Link
        to="/dashboard/student/preparation/mock-tests"
        className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-650 hover:text-indigo-800 transition-colors uppercase tracking-wider mb-6"
      >
        <FiArrowLeft className="w-4 h-4" /> Back to Mock Tests
      </Link>

      {/* Result Status Banner */}
      <div
        className={`rounded-3xl border p-8 mb-6 text-center animate-scale-in shadow-sm ${
          passed
            ? "bg-emerald-50 border-emerald-150 text-emerald-800"
            : "bg-rose-50 border-rose-150 text-rose-800"
        }`}
      >
        <FiAward className={`mx-auto mb-3.5 ${passed ? "text-emerald-600" : "text-rose-600"}`} size={44} />
        <h2 className="text-2xl font-black tracking-tight">{passed ? "Passed Successfully!" : "Test Not Passed"}</h2>
        {attempt.mock_test_id?.title && (
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">
            {attempt.mock_test_id.title}
          </p>
        )}
      </div>

      {/* Scores and Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center shadow-sm">
          <p className="text-2xl font-black text-indigo-650">
            {attempt.score} <span className="text-slate-400 text-xs font-bold">/ {attempt.max_score}</span>
          </p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">Your Score</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center shadow-sm">
          <p className="text-2xl font-black text-emerald-600">{attempt.correct_answers}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">Correct Ans</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center shadow-sm">
          <p className="text-2xl font-black text-rose-600">{attempt.wrong_answers}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">Incorrect Ans</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center shadow-sm">
          <p className="text-2xl font-black text-slate-600">{attempt.skipped}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">Skipped</p>
        </div>
      </div>

      {/* Accuracy & Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center shadow-sm flex items-center justify-center gap-4">
          <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 flex-shrink-0">
            <FiTarget className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xl font-black text-purple-650">{attempt.accuracy}%</p>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">Test Accuracy</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center shadow-sm flex items-center justify-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
            <FiClock className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xl font-black text-blue-650">
              {Math.floor((attempt.time_taken_seconds || 0) / 60)}m {(attempt.time_taken_seconds || 0) % 60}s
            </p>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">Total Time Taken</p>
          </div>
        </div>
      </div>

      {/* Toggle Details Review Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full bg-white rounded-3xl border border-slate-200 p-4 text-center font-black text-xs uppercase tracking-wider text-indigo-650 hover:bg-slate-50 transition-colors shadow-sm mb-6 flex items-center justify-center gap-2"
      >
        <FiEye className="w-4 h-4" /> {showDetails ? "Hide" : "Show"} Detailed Solutions Review
      </button>

      {/* Questions Solution Review Details */}
      {showDetails && (
        <div className="space-y-4 animate-scale-in">
          {attempt.answers.map((a, i) => {
            const q = questions.find((item) => item._id === a.question_id?.toString() || item._id === a.question_id);
            if (!q) return null;

            return (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start gap-3.5 mb-4">
                  {a.is_skipped ? (
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                      <FiMinus className="w-3.5 h-3.5" />
                    </span>
                  ) : a.is_correct ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                      <FiCheck className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                      <FiX className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <p className="text-slate-800 font-bold text-sm leading-relaxed">
                    Q{i + 1}. {q.question_text}
                  </p>
                </div>

                {/* Options List */}
                <div className="ml-9 space-y-2.5">
                  {q.options.map((opt, idx) => {
                    const isCorrectIndex = idx === q.correct_option_index;
                    const isUserSelectedIndex = idx === a.selected_option;

                    let optStyle = "text-slate-600 border border-slate-100 bg-slate-50/50";
                    if (isCorrectIndex) {
                      optStyle = "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold";
                    } else if (isUserSelectedIndex && !a.is_correct) {
                      optStyle = "bg-rose-50 text-rose-800 border-rose-200 font-semibold";
                    }

                    return (
                      <div
                        key={idx}
                        className={`text-xs px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-2 ${optStyle}`}
                      >
                        <span className="font-extrabold uppercase">{String.fromCharCode(65 + idx)}.</span>
                        <span>{opt.text}</span>
                      </div>
                    );
                  })}

                  {/* Explanation Alert */}
                  {q.explanation && (
                    <div className="mt-4 bg-[#2563eb]/5 border border-[#2563eb]/10 rounded-2xl p-4 text-left animate-scale-in">
                      <h5 className="text-[10px] font-black text-[#3730a3] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span>💡</span> Solution Explanation
                      </h5>
                      <p className="text-xs text-slate-650 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TestResult;

