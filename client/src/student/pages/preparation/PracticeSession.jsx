import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiCheck, FiX, FiBookmark, FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";

const PracticeSession = () => {
  const { topicId } = useParams();
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState(-1);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, total: 0 });
  const [page, setPage] = useState(1);
  const topicName = location.state?.topic?.name || "Practice";

  useEffect(() => { fetchQuestions(); }, [topicId, page]);

  const fetchQuestions = async () => {
    try {
      const { data } = await customFetch.get(`/preparation/questions/practice/${topicId}?page=${page}&limit=20`);
      setQuestions(data.questions);
    } catch { toast.error("Failed to load questions"); }
    finally { setLoading(false); }
  };

  const handleAnswer = (idx) => {
    if (showAnswer) return;
    setUserAnswer(idx);
    setShowAnswer(true);
    const isCorrect = idx === questions[currentIdx].correct_option_index;
    setStats(s => ({ correct: s.correct + (isCorrect ? 1 : 0), wrong: s.wrong + (isCorrect ? 0 : 1), total: s.total + 1 }));
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setUserAnswer(-1);
      setShowAnswer(false);
    } else if (questions.length === 20) {
      setPage(p => p + 1);
      setCurrentIdx(0);
      setUserAnswer(-1);
      setShowAnswer(false);
      setLoading(true);
    }
  };

  const handleBookmark = async () => {
    try {
      await customFetch.post("/preparation/bookmarks/toggle", { item_type: "question", item_id: questions[currentIdx]._id });
      toast.success("Bookmark toggled");
    } catch {}
  };

  if (loading) return <Loading />;
  const currentQ = questions[currentIdx];
  if (!currentQ) return <p className="text-center py-10 text-gray-500">No questions available for this topic</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/dashboard/student/preparation/subjects" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
          <FiArrowLeft /> Back
        </Link>
        <div className="flex gap-3 text-xs">
          <span className="bg-green-50 text-green-700 px-2 py-1 rounded">{stats.correct} correct</span>
          <span className="bg-red-50 text-red-700 px-2 py-1 rounded">{stats.wrong} wrong</span>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">{stats.total} total</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs text-gray-400">Q{(page - 1) * 20 + currentIdx + 1} - {topicName}</span>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${currentQ.difficulty === "easy" ? "bg-green-50 text-green-700" : currentQ.difficulty === "hard" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>{currentQ.difficulty}</span>
          </div>
          <button onClick={handleBookmark} className="text-yellow-500 hover:text-yellow-600"><FiBookmark size={18} /></button>
        </div>

        <p className="text-gray-800 font-medium mb-5">{currentQ.question_text}</p>

        <div className="space-y-2">
          {currentQ.options.map((opt, idx) => (
            <button key={idx} onClick={() => handleAnswer(idx)}
              disabled={showAnswer}
              className={`w-full text-left px-4 py-3 rounded-lg border transition text-sm ${showAnswer
                ? idx === currentQ.correct_option_index ? "border-green-400 bg-green-50 text-green-800" : idx === userAnswer && idx !== currentQ.correct_option_index ? "border-red-400 bg-red-50 text-red-800" : "border-gray-200"
                : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer"}`}>
              <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span> {opt.text}
              {showAnswer && idx === currentQ.correct_option_index && <FiCheck className="inline ml-2 text-green-600" />}
              {showAnswer && idx === userAnswer && idx !== currentQ.correct_option_index && <FiX className="inline ml-2 text-red-600" />}
            </button>
          ))}
        </div>

        {showAnswer && currentQ.explanation && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-700"><span className="font-medium">Explanation:</span> {currentQ.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => { if (currentIdx > 0) { setCurrentIdx(i => i - 1); setUserAnswer(-1); setShowAnswer(false); } }}
          disabled={currentIdx === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm disabled:opacity-50">
          <FiChevronLeft /> Previous
        </button>
        <button onClick={nextQuestion}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">
          Next <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default PracticeSession;
