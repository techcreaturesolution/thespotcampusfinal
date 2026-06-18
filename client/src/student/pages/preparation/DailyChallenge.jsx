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
    if (submitted) return;
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
    } catch (err) { toast.error(err?.response?.data?.msg || "Failed to submit"); }
  };

  if (loading) return <Loading />;
  if (!challenge) return <p className="text-center text-gray-500 py-10">No daily challenge available today. Check back tomorrow!</p>;

  // Already completed view
  if (alreadyCompleted && previousAttempt) {
    return (
      <div>
        <PageHeader title="Daily Challenge" subtitle="Today's challenge completed!" />
        <div className="max-w-lg mx-auto bg-green-50 rounded-xl border border-green-200 p-6 text-center">
          <FiAward className="mx-auto text-green-600 mb-3" size={40} />
          <h3 className="text-xl font-bold text-green-700 mb-2">Already Completed!</h3>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div><p className="text-lg font-bold text-green-600">{previousAttempt.correct_answers}</p><p className="text-xs text-gray-500">Correct</p></div>
            <div><p className="text-lg font-bold text-red-600">{previousAttempt.wrong_answers}</p><p className="text-xs text-gray-500">Wrong</p></div>
            <div><p className="text-lg font-bold text-purple-600">{previousAttempt.accuracy}%</p><p className="text-xs text-gray-500">Accuracy</p></div>
          </div>
          <p className="text-sm text-gray-600 mt-4">Come back tomorrow for a new challenge!</p>
        </div>
      </div>
    );
  }

  // Result view
  if (submitted && result) {
    return (
      <div>
        <PageHeader title="Daily Challenge" subtitle="Results" />
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <FiZap className="mx-auto text-amber-500 mb-3" size={40} />
          <h3 className="text-xl font-bold text-gray-800 mb-4">Challenge Complete!</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div><p className="text-lg font-bold text-indigo-600">{result.score}/{result.max_score}</p><p className="text-xs text-gray-500">Score</p></div>
            <div><p className="text-lg font-bold text-green-600">{result.correct_answers}</p><p className="text-xs text-gray-500">Correct</p></div>
            <div><p className="text-lg font-bold text-red-600">{result.wrong_answers}</p><p className="text-xs text-gray-500">Wrong</p></div>
            <div><p className="text-lg font-bold text-purple-600">{result.accuracy}%</p><p className="text-xs text-gray-500">Accuracy</p></div>
          </div>
        </div>
        {/* Show answers review */}
        <div className="max-w-lg mx-auto mt-4 space-y-3">
          {challenge.questions.map((q, i) => {
            const userAns = answers[q._id];
            const isCorrect = userAns === q.correct_option_index;
            return (
              <div key={q._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-2 mb-2">
                  {userAns === undefined ? <FiX className="text-gray-400 mt-0.5" /> : isCorrect ? <FiCheck className="text-green-600 mt-0.5" /> : <FiX className="text-red-600 mt-0.5" />}
                  <p className="text-sm text-gray-800">{q.question_text}</p>
                </div>
                <div className="ml-6 space-y-1">
                  {q.options.map((opt, idx) => (
                    <p key={idx} className={`text-xs px-2 py-0.5 rounded ${idx === q.correct_option_index ? "bg-green-50 text-green-700 font-medium" : idx === userAns && !isCorrect ? "bg-red-50 text-red-700" : "text-gray-500"}`}>
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
    <div>
      <PageHeader title="Daily Challenge" subtitle={`${challenge.total_questions} mixed questions`} />
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">Q {currentIdx + 1}/{challenge.questions.length}</span>
          <span className="text-sm text-gray-500">{answeredCount}/{challenge.questions.length} answered</span>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <p className="text-gray-800 font-medium mb-5">{currentQ?.question_text}</p>
          <div className="space-y-2">
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
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm disabled:opacity-50">Previous</button>
          {currentIdx === challenge.questions.length - 1 ? (
            <button onClick={handleSubmit} disabled={answeredCount === 0}
              className="px-6 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50">Submit Challenge</button>
          ) : (
            <button onClick={() => setCurrentIdx(i => i + 1)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Next</button>
          )}
        </div>

        {/* Palette */}
        <div className="mt-4 flex flex-wrap gap-2">
          {challenge.questions.map((q, i) => (
            <button key={q._id} onClick={() => setCurrentIdx(i)}
              className={`w-7 h-7 rounded text-xs font-medium ${i === currentIdx ? "bg-indigo-600 text-white" : answers[q._id] !== undefined ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyChallenge;
