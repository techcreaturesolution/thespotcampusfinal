import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiTrendingUp, FiTarget, FiZap, FiAward, FiClock } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const PerformanceDashboard = () => {
  const [progress, setProgress] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, sRes, gRes, aRes] = await Promise.all([
          customFetch.get("/preparation/progress"),
          customFetch.get("/preparation/progress/subjects"),
          customFetch.get("/preparation/progress/graphs"),
          customFetch.get("/preparation/progress/activity"),
        ]);
        setProgress(pRes.data.progress);
        setSubjectData(sRes.data);
        setGraphData(gRes.data);
        setActivities(aRes.data.activities);
      } catch { toast.error("Failed to load performance data"); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        icon={FiTrendingUp}
        title="Performance Analytics"
        subtitle="Detailed analysis of your preparation progress"
      />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200 p-4 text-center shadow-sm">
          <FiTarget className="mx-auto text-[#3730a3] mb-2" size={20} />
          <p className="text-2xl font-black text-slate-800">{progress?.total_questions_solved || 0}</p>
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-1">Questions Solved</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-4 text-center shadow-sm">
          <FiTrendingUp className="mx-auto text-emerald-600 mb-2" size={20} />
          <p className="text-2xl font-black text-slate-800">{progress?.tests_attempted || 0}</p>
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-1">Tests Attempted</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-4 text-center shadow-sm">
          <FiAward className="mx-auto text-amber-600 mb-2" size={20} />
          <p className="text-2xl font-black text-slate-800">{progress?.overall_accuracy || 0}%</p>
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-1">Accuracy</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-4 text-center shadow-sm">
          <FiZap className="mx-auto text-red-500 mb-2" size={20} />
          <p className="text-2xl font-black text-slate-800">{progress?.current_streak || 0}</p>
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-1">Current Streak</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-4 text-center shadow-sm col-span-2 md:col-span-1">
          <FiZap className="mx-auto text-purple-650 mb-2" size={20} />
          <p className="text-2xl font-black text-slate-800">{progress?.longest_streak || 0}</p>
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-1">Best Streak</p>
        </div>
      </div>

      {/* Main Charts / Progress Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Progress */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-5">Weekly Activity Progress</h3>
          {graphData?.weekly?.length > 0 ? (
            <div className="space-y-3.5">
              {graphData.weekly.map((day, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] font-extrabold text-slate-455 w-16 uppercase tracking-wider">{day.date?.slice(5)}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#3730a3] to-[#2563eb] h-full rounded-full transition-all" style={{ width: `${Math.min(100, (day.questions_solved || 0) * 5)}%` }}></div>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-800 w-8 text-right">{day.questions_solved} Q</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4">No activity logged this week yet.</p>
          )}
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-5">Subject Performance</h3>
          {subjectData?.subject_progress?.length > 0 ? (
            <div className="space-y-4">
              {subjectData.subject_progress.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="font-bold text-slate-700">{s.subject_name}</span>
                    <span className="font-extrabold text-slate-500">{s.accuracy}% ({s.questions_attempted} Q)</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full rounded-full ${
                      s.accuracy >= 70
                        ? "bg-emerald-500"
                        : s.accuracy >= 40
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                      style={{ width: `${s.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4">No subject data recorded yet. Start practicing!</p>
          )}
        </div>
      </div>

      {/* Strong & Weak Subjects Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strong Subjects */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2">
            <FiAward className="text-emerald-600 w-5 h-5" /> Strong Subjects
          </h3>
          {subjectData?.strong_subjects?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {subjectData.strong_subjects.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <span className="text-xs font-bold text-slate-750">{s.subject_name}</span>
                  <span className="text-xs font-extrabold text-emerald-650 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                    {s.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-2">Keep practicing to identify strengths</p>
          )}
        </div>

        {/* Weak Subjects */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2">
            <FiTarget className="text-rose-500 w-5 h-5" /> Needs Improvement
          </h3>
          {subjectData?.weak_subjects?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {subjectData.weak_subjects.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <span className="text-xs font-bold text-slate-750">{s.subject_name}</span>
                  <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">
                    {s.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-2">No weak areas detected</p>
          )}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-4">Recent Activity Logs</h3>
        {activities.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {activities.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <FiClock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 truncate leading-snug">
                      {a.mock_test_id?.title || a.subject_id?.name || a.test_type}
                    </p>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">
                      {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-indigo-650">{a.accuracy}%</p>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">
                    {a.correct_answers}/{a.total_questions} Ans
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-450 py-4">No recent activity logged yet.</p>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
