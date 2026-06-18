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
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!attempt && attemptId) {
      customFetch.get(`/preparation/mock-tests/result/${attemptId}`).then(({ data }) => {
        if (data.attempt.status === "completed") {
          navigate(`/dashboard/student/preparation/test-result/${attemptId}`, { replace: true });
        } else {
          setAttempt(data.attempt);
          setQuestions(data.questions);
        }
      }).catch(() => navigate("/dashboard/student/preparation/mock-tests", { replace: true }));
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attempt) return;
    // Estimate time from mock test duration (30 min default)
    const durationMs = 30 * 60 * 1000;
    const elapsed = Date.now() - new Date(attempt.started_at).getTime();
    const remaining = Math.max(0, durationMs - elapsed);
    setTimeLeft(Math.floor(remaining / 1000));
  }, [attempt]);

  useEffect(() => {
    if (timeLeft <= 0 && attempt) { handleSubmit(); return; }
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswer = (qId, optionIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const answerPayload = questions.map(q => ({
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
      toast.success("Test submitted!");
      navigate(`/dashboard/student/preparation/test-result/${attemptId || attempt._id}`, { replace: true });
    } catch (err) {
      toast.error("Failed to submit");
      setSubmitting(false);
    }
  }, [submitting, answers, questions, attemptId, attempt, startTime, navigate]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  if (!questions.length) return <div className="text-center py-10 text-gray-500">Loading test...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">Q {currentIdx + 1}/{questions.length}</span>
          <span className="text-sm text-gray-500">{answeredCount} answered</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1 font-mono text-sm font-bold ${timeLeft < 60 ? "text-red-600" : "text-gray-700"}`}>
            <FiClock size={14} /> {formatTime(timeLeft)}
          </span>
          <button onClick={() => { if (confirm("Submit test now?")) handleSubmit(); }}
            disabled={submitting}
            className="bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">
            <FiFlag className="inline mr-1" /> Submit
          </button>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <p className="text-gray-800 font-medium mb-6">{currentQ?.question_text}</p>
        <div className="space-y-3">
          {currentQ?.options.map((opt, idx) => (
            <button key={idx} onClick={() => handleAnswer(currentQ._id, idx)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition text-sm ${answers[currentQ._id] === idx ? "border-indigo-400 bg-indigo-50 text-indigo-800 font-medium" : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"}`}>
              <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span> {opt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm disabled:opacity-50">
          <FiChevronLeft /> Previous
        </button>
        <button onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))} disabled={currentIdx === questions.length - 1}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm disabled:opacity-50">
          Next <FiChevronRight />
        </button>
      </div>

      {/* Question Palette */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <p className="text-xs text-gray-500 mb-2">Question Palette</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => (
            <button key={q._id} onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition ${i === currentIdx ? "bg-indigo-600 text-white" : answers[q._id] !== undefined ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
