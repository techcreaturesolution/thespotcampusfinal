import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FiClock, FiChevronLeft, FiChevronRight, FiFlag } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";

const TakeTest = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [attempt, setAttempt] = useState(location.state?.attempt || null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(location.state?.remainingSeconds ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const handleAnswer = (qId, optionIdx) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const answerPayload = questions.map((q) => ({
      question_id: q._id,
      selected_option: answers[q._id] !== undefined ? answers[q._id] : -1,
      is_correct: answers[q._id] === q.correct_option_index,
      time_spent_seconds: 0,
    }));
    try {
      await customFetch.post(`/preparation/mock-tests/submit/${attemptId || attempt._id}`, {
        answers: answerPayload,
        time_taken_seconds: timeTaken,
      });
      toast.success("Test submitted successfully!");
      navigate(`/dashboard/student/preparation/test-result/${attemptId || attempt._id}`, { replace: true });
    } catch {
      toast.error("Failed to submit test");
      setSubmitting(false);
    }
  }, [submitting, answers, questions, attemptId, attempt, startTime, navigate]);

  const formatTime = (s) => {
    if (s === null) return "--:--";
    return `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if ((!attempt || !questions.length) && attemptId) {
      customFetch
        .get(`/preparation/mock-tests/result/${attemptId}`)
        .then(({ data }) => {
          if (data.attempt.status === "completed") {
            navigate(`/dashboard/student/preparation/test-result/${attemptId}`, { replace: true });
          } else {
            setAttempt(data.attempt);
            setQuestions(data.questions || []);
            if (data.remaining_seconds !== undefined) {
              setTimeLeft(data.remaining_seconds);
            }
          }
        })
        .catch(() => navigate("/dashboard/student/preparation/mock-tests", { replace: true }));
    }
  }, [attemptId, attempt, questions.length, navigate]);

  useEffect(() => {
    if (!attempt || timeLeft !== null) return;
    const durationMs = (attempt.mock_test_id?.duration_minutes || 30) * 60 * 1000;
    const elapsed = Date.now() - new Date(attempt.started_at).getTime();
    const remaining = Math.max(0, durationMs - elapsed);
    setTimeLeft(Math.floor(remaining / 1000));
  }, [attempt, timeLeft]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0 && attempt && questions.length > 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, attempt, questions.length, handleSubmit]);

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  if (!questions.length) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center animate-pulse">
        <p className="text-slate-400 font-medium">Loading test questions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 text-left animate-fade-in">
      {/* Sticky Header Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 mb-6 flex items-center justify-between sticky top-0 z-10 shadow-sm backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            Q {currentIdx + 1} / {questions.length}
          </span>
          <span className="text-xs text-slate-450 font-semibold hidden sm:inline">
            {answeredCount} Answered
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-1.5 font-mono text-sm font-black border rounded-full px-4 py-1.5 shadow-sm transition-colors ${
              timeLeft !== null && timeLeft < 60
                ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <FiClock className="w-4 h-4" /> {formatTime(timeLeft)}
          </div>

          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to submit the test now?")) {
                handleSubmit();
              }
            }}
            disabled={submitting}
            className="flex items-center gap-1.5 bg-rose-600 text-white hover:bg-rose-700 px-4 py-2 rounded-full text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
          >
            <FiFlag className="w-3.5 h-3.5" /> Submit Test
          </button>
        </div>
      </div>

      {/* Main Active Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-6 transition-all duration-300">
        <span className="inline-block bg-[#2563eb]/5 text-[#2563eb] border border-[#2563eb]/10 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-4">
          Question {currentIdx + 1}
        </span>

        <h2 className="text-slate-800 text-base sm:text-lg font-bold mb-6 leading-relaxed">
          {currentQ?.question_text}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {currentQ?.options.map((opt, idx) => {
            const isSelected = answers[currentQ._id] === idx;

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(currentQ._id, idx)}
                className={`w-full text-left px-5 py-4 rounded-2xl border transition-all text-sm flex items-center gap-3 ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/50 text-[#3730a3] font-bold"
                    : "border-slate-250 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-650"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Row */}
      <div className="flex justify-between items-center mb-8 gap-4">
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
        >
          <FiChevronLeft className="w-4 h-4" /> Previous
        </button>

        <button
          onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
          disabled={currentIdx === questions.length - 1}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
        >
          Next <FiChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Circular Question Palette */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <p className="text-xs text-slate-450 font-black uppercase tracking-wider mb-4">
          Question Palette
        </p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => {
            const isActive = i === currentIdx;
            const isAnswered = answers[q._id] !== undefined;

            let paletteStyle = "bg-slate-50 text-slate-650 hover:bg-slate-100 border border-slate-200";
            if (isActive) {
              paletteStyle = "vibrant-btn text-white border-transparent shadow-sm";
            } else if (isAnswered) {
              paletteStyle = "bg-emerald-50 text-emerald-700 border border-emerald-150";
            }

            return (
              <button
                key={q._id}
                onClick={() => setCurrentIdx(i)}
                className={`w-9 h-9 rounded-full text-xs font-black transition-all flex items-center justify-center ${paletteStyle}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TakeTest;

