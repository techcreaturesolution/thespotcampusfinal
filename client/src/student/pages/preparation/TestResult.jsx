import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiCheck, FiX, FiMinus, FiArrowLeft, FiAward } from "react-icons/fi";
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
        setAttempt(data.attempt); setQuestions(data.questions);
      } catch {}
      finally { setLoading(false); }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) return <Loading />;
  if (!attempt) return <p className="text-center text-gray-500 py-10">Result not found</p>;

  const passed = attempt.mock_test_id?.passing_percentage
    ? attempt.accuracy >= attempt.mock_test_id.passing_percentage : attempt.accuracy >= 40;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/dashboard/student/preparation/mock-tests" className="flex items-center gap-1 text-sm text-indigo-600 mb-4 hover:underline">
        <FiArrowLeft /> Back to Mock Tests
      </Link>

      {/* Result Summary */}
      <div className={`rounded-xl shadow-sm border p-6 mb-6 text-center ${passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <FiAward className={`mx-auto mb-2 ${passed ? "text-green-600" : "text-red-600"}`} size={40} />
        <h2 className={`text-2xl font-bold ${passed ? "text-green-700" : "text-red-700"}`}>{passed ? "Passed!" : "Not Passed"}</h2>
        {attempt.mock_test_id?.title && <p className="text-sm text-gray-600 mt-1">{attempt.mock_test_id.title}</p>}
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{attempt.score}/{attempt.max_score}</p>
          <p className="text-xs text-gray-500">Score</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{attempt.correct_answers}</p>
          <p className="text-xs text-gray-500">Correct</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{attempt.wrong_answers}</p>
          <p className="text-xs text-gray-500">Wrong</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{attempt.skipped}</p>
          <p className="text-xs text-gray-500">Skipped</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xl font-bold text-purple-600">{attempt.accuracy}%</p>
          <p className="text-xs text-gray-500">Accuracy</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xl font-bold text-blue-600">{Math.floor((attempt.time_taken_seconds || 0) / 60)}m {(attempt.time_taken_seconds || 0) % 60}s</p>
          <p className="text-xs text-gray-500">Time Taken</p>
        </div>
      </div>

      {/* Detailed Review */}
      <button onClick={() => setShowDetails(!showDetails)}
        className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center text-indigo-600 font-medium hover:bg-indigo-50 transition mb-4">
        {showDetails ? "Hide" : "Show"} Detailed Review
      </button>

      {showDetails && (
        <div className="space-y-4">
          {attempt.answers.map((a, i) => {
            const q = questions.find(q => q._id === a.question_id?.toString() || q._id === a.question_id);
            if (!q) return null;
            return (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-2 mb-3">
                  {a.is_skipped ? <FiMinus className="text-gray-400 mt-1" /> : a.is_correct ? <FiCheck className="text-green-600 mt-1" /> : <FiX className="text-red-600 mt-1" />}
                  <p className="text-sm text-gray-800 font-medium">Q{i + 1}. {q.question_text}</p>
                </div>
                <div className="ml-6 space-y-1">
                  {q.options.map((opt, idx) => (
                    <p key={idx} className={`text-xs px-2 py-1 rounded ${idx === q.correct_option_index ? "bg-green-50 text-green-700 font-medium" : idx === a.selected_option && !a.is_correct ? "bg-red-50 text-red-700" : "text-gray-600"}`}>
                      {String.fromCharCode(65 + idx)}. {opt.text}
                    </p>
                  ))}
                  {q.explanation && <p className="text-xs text-blue-600 mt-2 italic">Explanation: {q.explanation}</p>}
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
