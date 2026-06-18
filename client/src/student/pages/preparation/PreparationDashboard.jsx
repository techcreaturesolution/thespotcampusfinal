import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBook, FiFileText, FiTarget, FiBookOpen, FiZap, FiTrendingUp, FiAward, FiCheckCircle } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const PreparationDashboard = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try { const { data } = await customFetch.get("/preparation/progress"); setProgress(data.progress); }
      catch {} finally { setLoading(false); }
    };
    fetchProgress();
  }, []);

  const modules = [
    { path: "/dashboard/student/preparation/previous-papers", icon: <FiBook className="text-2xl" />, title: "Previous Year Papers", desc: "Practice real placement questions from top companies", color: "bg-blue-50 text-blue-600 border-blue-100" },
    { path: "/dashboard/student/preparation/mock-tests", icon: <FiTarget className="text-2xl" />, title: "Mock Tests", desc: "Simulate real placement rounds with timed tests", color: "bg-purple-50 text-purple-600 border-purple-100" },
    { path: "/dashboard/student/preparation/subjects", icon: <FiBookOpen className="text-2xl" />, title: "Subject Wise Practice", desc: "Focused preparation by subject and topic", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { path: "/dashboard/student/preparation/reading-material", icon: <FiFileText className="text-2xl" />, title: "Reading Material", desc: "Study PDFs for comprehensive preparation", color: "bg-amber-50 text-amber-600 border-amber-100" },
    { path: "/dashboard/student/preparation/daily-challenge", icon: <FiZap className="text-2xl" />, title: "Daily Challenge", desc: "10 mixed questions daily to keep your streak", color: "bg-red-50 text-red-600 border-red-100" },
    { path: "/dashboard/student/preparation/performance", icon: <FiTrendingUp className="text-2xl" />, title: "Performance Dashboard", desc: "Track your progress and identify weak areas", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Preparation" subtitle="Your complete placement preparation hub" />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{progress?.total_questions_solved || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Questions Solved</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{progress?.tests_attempted || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Tests Attempted</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{progress?.overall_accuracy || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">Accuracy</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <FiZap className="text-red-500" />
            <p className="text-2xl font-bold text-red-600">{progress?.current_streak || 0}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Day Streak</p>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((m) => (
          <Link key={m.path} to={m.path}
            className={`rounded-xl border p-6 hover:shadow-lg transition-all duration-200 ${m.color}`}>
            <div className="mb-3">{m.icon}</div>
            <h3 className="font-bold text-gray-800 mb-1">{m.title}</h3>
            <p className="text-sm text-gray-500">{m.desc}</p>
          </Link>
        ))}
      </div>

      {/* Strong & Weak Subjects */}
      {progress?.subject_progress?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FiAward className="text-green-600" /> Strong Subjects</h3>
            {progress.subject_progress.filter(s => s.accuracy >= 70).slice(0, 4).map((s, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{s.subject_name}</span>
                <span className="text-sm font-bold text-green-600">{s.accuracy}%</span>
              </div>
            ))}
            {progress.subject_progress.filter(s => s.accuracy >= 70).length === 0 && <p className="text-sm text-gray-400">Keep practicing to identify strengths</p>}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FiCheckCircle className="text-red-500" /> Weak Subjects</h3>
            {progress.subject_progress.filter(s => s.accuracy < 50 && s.questions_attempted > 0).slice(0, 4).map((s, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{s.subject_name}</span>
                <span className="text-sm font-bold text-red-600">{s.accuracy}%</span>
              </div>
            ))}
            {progress.subject_progress.filter(s => s.accuracy < 50 && s.questions_attempted > 0).length === 0 && <p className="text-sm text-gray-400">No weak areas detected yet</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreparationDashboard;
