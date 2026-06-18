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
    <div>
      <PageHeader title="Performance Dashboard" subtitle="Track your preparation progress" />

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <FiTarget className="mx-auto text-indigo-600 mb-1" size={20} />
          <p className="text-xl font-bold text-gray-800">{progress?.total_questions_solved || 0}</p>
          <p className="text-xs text-gray-500">Questions Solved</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <FiTrendingUp className="mx-auto text-emerald-600 mb-1" size={20} />
          <p className="text-xl font-bold text-gray-800">{progress?.tests_attempted || 0}</p>
          <p className="text-xs text-gray-500">Tests Attempted</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <FiAward className="mx-auto text-amber-600 mb-1" size={20} />
          <p className="text-xl font-bold text-gray-800">{progress?.overall_accuracy || 0}%</p>
          <p className="text-xs text-gray-500">Accuracy</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <FiZap className="mx-auto text-red-600 mb-1" size={20} />
          <p className="text-xl font-bold text-gray-800">{progress?.current_streak || 0}</p>
          <p className="text-xs text-gray-500">Current Streak</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <FiZap className="mx-auto text-purple-600 mb-1" size={20} />
          <p className="text-xl font-bold text-gray-800">{progress?.longest_streak || 0}</p>
          <p className="text-xs text-gray-500">Best Streak</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Weekly Activity</h3>
          {graphData?.weekly?.length > 0 ? (
            <div className="space-y-2">
              {graphData.weekly.map((day, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20">{day.date?.slice(5)}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (day.questions_solved || 0) * 5)}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-600 w-8">{day.questions_solved}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No activity this week yet</p>}
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Subject Performance</h3>
          {subjectData?.subject_progress?.length > 0 ? (
            <div className="space-y-3">
              {subjectData.subject_progress.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">{s.subject_name}</span>
                    <span className="text-xs text-gray-500">{s.accuracy}% ({s.questions_attempted}Q)</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${s.accuracy >= 70 ? "bg-green-500" : s.accuracy >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${s.accuracy}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No subject data yet. Start practicing!</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strong Subjects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FiAward className="text-green-600" /> Strong Subjects</h3>
          {subjectData?.strong_subjects?.length > 0 ? (
            <div className="space-y-2">
              {subjectData.strong_subjects.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{s.subject_name}</span>
                  <span className="text-sm font-bold text-green-600">{s.accuracy}%</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">Keep practicing to identify strengths</p>}
        </div>

        {/* Weak Subjects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FiTarget className="text-red-500" /> Needs Improvement</h3>
          {subjectData?.weak_subjects?.length > 0 ? (
            <div className="space-y-2">
              {subjectData.weak_subjects.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{s.subject_name}</span>
                  <span className="text-sm font-bold text-red-600">{s.accuracy}%</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No weak areas detected</p>}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6">
        <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
        {activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <FiClock className="text-gray-400" size={14} />
                  <div>
                    <p className="text-sm text-gray-700">{a.mock_test_id?.title || a.subject_id?.name || a.test_type}</p>
                    <p className="text-xs text-gray-400">{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">{a.accuracy}%</p>
                  <p className="text-xs text-gray-400">{a.correct_answers}/{a.total_questions}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">No activity yet</p>}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
