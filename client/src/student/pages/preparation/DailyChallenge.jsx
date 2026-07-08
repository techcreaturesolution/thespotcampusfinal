import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiZap, FiCheck, FiX, FiAward } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const DailyChallenge = () => {
  const [challenge, setChallenge] = useState(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [previousAttempt, setPreviousAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const { data } = await customFetch.get("/preparation/daily-challenge");
        setChallenge(data.challenge);
        setAlreadyCompleted(data.already_completed);
        setPreviousAttempt(data.attempt);
      } catch { toast.error("Failed to load challenge"); }
      finally { setLoading(false); }
    };
    fetchChallenge();
  }, []);

  const handleAnswer = (qId, optIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = async () => {
    if (submitted || submitting) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const answerPayload = challenge.questions.map(q => ({
      question_id: q._id,
      selected_option: answers[q._id] !== undefined ? answers[q._id] : -1,
    }));
    try {
      const { data } = await customFetch.post("/preparation/daily-challenge/submit", { answers: answerPayload, time_taken_seconds: timeTaken });
      setResult(data.attempt);
      setSubmitted(true);
      toast.success(`Challenge complete! Streak: ${data.streak} days`);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (!challenge) return (
    <div className="max-w-xl mx-auto py-12 text-center animate-fade-in">
      <FiZap className="w-12 h-12 text-slate-350 mx-auto mb-3" />
      <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">No Challenge Today</h3>
      <p className="text-xs text-slate-450 mt-1">No daily challenge is available right now. Check back tomorrow!</p>
    </div>
  );

  // Already completed view
  if (alreadyCompleted && previousAttempt) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-2 text-left animate-fade-in">
        <PageHeader title="Daily Challenge" subtitle="Today's challenge completed!" />
        <div className="bg-emerald-50/50 border border-emerald-150 rounded-3xl p-6 text-center shadow-xs">
          <FiAward className="mx-auto text-emerald-600 mb-3" size={40} />
          <h3 className="text-lg font-black text-emerald-700 uppercase tracking-wide">Already Completed!</h3>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-2xl font-black text-emerald-600">{previousAttempt.correct_answers}</p>
              <p className="text-[10px] text-slate-450 font-extrabold uppercase mt-1">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-black text-rose-600">{previousAttempt.wrong_answers}</p>
              <p className="text-[10px] text-slate-455 font-extrabold uppercase mt-1">Wrong</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[#3730a3]">{previousAttempt.accuracy}%</p>
              <p className="text-[10px] text-slate-450 font-extrabold uppercase mt-1">Accuracy</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-6">Come back tomorrow for a new challenge!</p>
        </div>
      </div>
    );
  }

  // Result view
  if (submitted && result) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-2 text-left animate-fade-in">
        <PageHeader title="Daily Challenge" subtitle="Challenge summary results" />
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm">
          <FiZap className="mx-auto text-amber-500 mb-3 animate-bounce-slow" size={40} />
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide mb-5">Challenge Completed!</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-black text-[#3730a3]">{result.score}/{result.max_score}</p>
              <p className="text-[9px] text-slate-450 font-extrabold uppercase mt-1">Score</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{result.correct_answers}</p>
              <p className="text-[9px] text-slate-450 font-extrabold uppercase mt-1">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-black text-rose-600">{result.wrong_answers}</p>
              <p className="text-[9px] text-slate-455 font-extrabold uppercase mt-1">Wrong</p>
            </div>
            <div>
              <p className="text-2xl font-black text-purple-600">{result.accuracy}%</p>
              <p className="text-[9px] text-slate-450 font-extrabold uppercase mt-1">Accuracy</p>
            </div>
          </div>
        </div>

        {/* Show answers review */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">Review Answers</h4>
          {challenge.questions.map((q, i) => {
            const userAns = answers[q._id];
            const isCorrect = userAns === q.correct_option_index;
            return (
              <div key={q._id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                <div className="flex items-start gap-2.5 mb-3">
                  <div className={`mt-0.5 p-0.5 rounded-full ${userAns === undefined ? "text-slate-400" : isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-650"}`}>
                    {userAns === undefined ? <FiX className="w-4 h-4" /> : isCorrect ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 leading-snug">{q.question_text}</p>
                </div>
                <div className="ml-7 space-y-1.5">
                  {q.options.map((opt, idx) => (
                    <p
                      key={idx}
                      className={`text-xs px-3 py-1.5 rounded-xl border ${
                        idx === q.correct_option_index
                          ? "bg-emerald-50/50 border-emerald-100 text-emerald-800 font-extrabold"
                          : idx === userAns && !isCorrect
                          ? "bg-rose-50 border-rose-100 text-rose-700 font-extrabold"
                          : "border-slate-100 text-slate-500"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}. {opt.text}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active challenge view
  const currentQ = challenge.questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        icon={FiZap}
        title="Daily Challenge"
        subtitle={`${challenge.total_questions} mixed topic practice questions`}
      />

      <div className="space-y-4">
        {/* Progress Bar & Summary */}
        <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">
          <span>Question {currentIdx + 1} of {challenge.questions.length}</span>
          <span>{answeredCount} of {challenge.questions.length} answered</span>
        </div>

        {/* Question Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm font-extrabold text-slate-800 leading-relaxed mb-6">
            {currentQ?.question_text}
          </p>
          <div className="space-y-2.5">
            {currentQ?.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(currentQ._id, idx)}
                className={`w-full text-left px-5 py-4 rounded-2xl border transition-all text-xs font-bold active:scale-99 flex items-center gap-3 ${
                  answers[currentQ._id] === idx
                    ? "border-indigo-500 bg-indigo-50/30 text-[#3730a3]"
                    : "border-slate-200 text-slate-650 hover:bg-slate-50"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] uppercase font-black transition-colors ${
                  answers[currentQ._id] === idx
                    ? "bg-[#3730a3] text-white"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold rounded-full text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-sm"
          >
            Previous
          </button>
          
          {currentIdx === challenge.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={answeredCount === 0 || submitting}
              className="vibrant-btn text-white font-extrabold py-2.5 px-6 rounded-full transition-all duration-200 shadow-md hover:opacity-95 text-[10px] uppercase tracking-wider disabled:opacity-50 active:scale-95"
            >
              {submitting ? "Submitting..." : "Submit Challenge"}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx(i => i + 1)}
              className="vibrant-btn text-white font-extrabold py-2.5 px-6 rounded-full transition-all duration-200 active:scale-95 text-[10px] uppercase tracking-wider shadow-md"
            >
              Next
            </button>
          )}
        </div>

        {/* Palette Grid */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Question Palette</p>
          <div className="flex flex-wrap gap-2">
            {challenge.questions.map((q, i) => {
              const isActive = i === currentIdx;
              const isAnswered = answers[q._id] !== undefined;
              let btnStyle = "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100";
              if (isActive) {
                btnStyle = "vibrant-btn border-transparent text-white shadow-sm";
              } else if (isAnswered) {
                btnStyle = "bg-emerald-50 border-emerald-150 text-emerald-700";
              }
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-9 h-9 rounded-full text-xs font-black transition active:scale-95 border flex items-center justify-center ${btnStyle}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallenge;
