import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBook, FiFileText, FiTarget, FiBookOpen, FiZap, FiTrendingUp, FiAward, FiCheckCircle, FiLock, FiArrowRight } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const PreparationDashboard = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data } = await customFetch.get("/preparation/progress");
        setProgress(data.progress);
      } catch (error) {
        if (error?.response?.status === 403) {
          setIsLocked(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const modules = [
    { path: "/dashboard/student/preparation/previous-papers", icon: <FiBook className="text-2xl" />, title: "Previous Year Papers", desc: "Practice real placement questions from top companies", color: "bg-blue-50/50 text-blue-600 border-blue-100 hover:border-blue-300" },
    { path: "/dashboard/student/preparation/mock-tests", icon: <FiTarget className="text-2xl" />, title: "Mock Tests", desc: "Simulate real placement rounds with timed tests", color: "bg-purple-50/50 text-purple-600 border-purple-100 hover:border-purple-300" },
    { path: "/dashboard/student/preparation/subjects", icon: <FiBookOpen className="text-2xl" />, title: "Subject Wise Practice", desc: "Focused preparation by subject", color: "bg-emerald-50/50 text-emerald-600 border-emerald-100 hover:border-emerald-300" },
    { path: "/dashboard/student/preparation/reading-material", icon: <FiFileText className="text-2xl" />, title: "Reading Material", desc: "Study PDFs for comprehensive preparation", color: "bg-amber-50/50 text-amber-600 border-amber-100 hover:border-amber-300" },
    { path: "/dashboard/student/preparation/daily-challenge", icon: <FiZap className="text-2xl" />, title: "Daily Challenge", desc: "10 mixed questions daily to keep your streak", color: "bg-rose-50/50 text-rose-600 border-rose-100 hover:border-rose-300" },
    { path: "/dashboard/student/preparation/performance", icon: <FiTrendingUp className="text-2xl" />, title: "Performance Dashboard", desc: "Track your progress and identify weak areas", color: "bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:border-indigo-300" },
  ];

  if (loading) return <Loading />;

  if (isLocked) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center animate-fade-in">
        <PageHeader
          icon={FiBookOpen}
          title="Preparation Hub"
          subtitle="Your complete placement preparation suite"
        />

        <div className="bg-gradient-to-br from-white via-white to-indigo-50/20 rounded-[2rem] border border-slate-200 p-8 md:p-12 shadow-xl shadow-indigo-950/5 relative overflow-hidden mt-6 text-left max-w-2xl mx-auto">
          {/* Subtle decorative glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-400/10 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col items-center text-center">
            {/* Pulsating locked badge */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-inner relative mb-6">
              <span className="absolute inset-0 rounded-2xl bg-indigo-400/10 animate-ping opacity-60" />
              <FiLock className="w-7 h-7 relative z-10" />
            </div>

            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none mb-3">
              Premium Placement Preparation
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-semibold max-w-md leading-relaxed mb-8">
              Unlock subject-wise practice banks, full-length timed mock exams, daily tech streaks, and detailed performance analytics. 
            </p>

            {/* Feature checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md text-left mb-8">
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <FiBook className="text-[#3730a3] w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-none">Previous Papers</h4>
                  <p className="text-[10px] text-slate-450 font-bold mt-1">Real company questions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <FiTarget className="text-[#3730a3] w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-none">Mock Exams</h4>
                  <p className="text-[10px] text-slate-450 font-bold mt-1">Real-time simulation</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <FiBookOpen className="text-[#3730a3] w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-none">Subject Banks</h4>
                  <p className="text-[10px] text-slate-450 font-bold mt-1">Topic-focused practice</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <FiFileText className="text-[#3730a3] w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-none">Reading Material</h4>
                  <p className="text-[10px] text-slate-450 font-bold mt-1">Study guides & PDFs</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <FiZap className="text-[#3730a3] w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-none">Daily Streaks</h4>
                  <p className="text-[10px] text-slate-450 font-bold mt-1">Consistent coding habits</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <FiTrendingUp className="text-[#3730a3] w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-none">Advanced Analytics</h4>
                  <p className="text-[10px] text-slate-450 font-bold mt-1">Track weak chapters</p>
                </div>
              </div>
            </div>

            <Link
              to="/dashboard/student/plans"
              className="inline-flex items-center justify-center gap-2 bg-[#3730a3] hover:bg-indigo-850 text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition duration-200 active:scale-95 shadow-md shadow-indigo-950/10 w-full sm:w-auto"
            >
              Unlock Preparation Section <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        icon={FiBookOpen}
        title="Preparation Hub"
        subtitle="Your complete placement preparation suite"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center shadow-sm hover:shadow-md transition">
          <p className="text-3xl font-black text-indigo-650">{progress?.total_questions_solved || 0}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">Questions Solved</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center shadow-sm hover:shadow-md transition">
          <p className="text-3xl font-black text-emerald-600">{progress?.tests_attempted || 0}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">Tests Attempted</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center shadow-sm hover:shadow-md transition">
          <p className="text-3xl font-black text-amber-600">{progress?.overall_accuracy || 0}%</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">Accuracy</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-center gap-1.5">
            <FiZap className="text-red-500 w-6 h-6 animate-pulse" />
            <p className="text-3xl font-black text-red-600">{progress?.current_streak || 0}</p>
          </div>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">Day Streak</p>
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className={`rounded-3xl border p-6 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${m.color}`}
          >
            <div>
              <div className="mb-4 inline-block p-2 bg-white rounded-xl shadow-xs">{m.icon}</div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-1.5">{m.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Strong & Weak Subjects */}
      {progress?.subject_progress?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2">
              <FiAward className="text-emerald-600 w-5 h-5" /> Strong Subjects
            </h3>
            <div className="divide-y divide-slate-100">
              {progress.subject_progress.filter(s => s.accuracy >= 70).slice(0, 4).map((s, i) => (
                <div key={i} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <span className="text-xs font-bold text-slate-700">{s.subject_name}</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    {s.accuracy}%
                  </span>
                </div>
              ))}
              {progress.subject_progress.filter(s => s.accuracy >= 70).length === 0 && (
                <p className="text-xs text-slate-400 py-2">Keep practicing to identify strengths</p>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2">
              <FiCheckCircle className="text-red-500 w-5 h-5" /> Weak Subjects
            </h3>
            <div className="divide-y divide-slate-100">
              {progress.subject_progress.filter(s => s.accuracy < 50 && s.questions_attempted > 0).slice(0, 4).map((s, i) => (
                <div key={i} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <span className="text-xs font-bold text-slate-700">{s.subject_name}</span>
                  <span className="text-xs font-extrabold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                    {s.accuracy}%
                  </span>
                </div>
              ))}
              {progress.subject_progress.filter(s => s.accuracy < 50 && s.questions_attempted > 0).length === 0 && (
                <p className="text-xs text-slate-400 py-2">No weak areas detected yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreparationDashboard;
