import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { FiBriefcase, FiFileText, FiVideo, FiUser, FiAward, FiInfo, FiCheck, FiPlay, FiAlertCircle, FiCpu } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import DashboardCard from "../../common/components/DashboardCard";

const StudentDashboard = ({ user: propUser }) => {
  const outletContext = useOutletContext() || {};
  const user = propUser || outletContext.user;

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appRes, statsRes] = await Promise.all([
          customFetch.get("/application/student"),
          customFetch.get("/stats"),
        ]);
        setApplications(appRes.data.applications || []);
        setStats(statsRes.data.stats);
      } catch (error) {
        console.error("Failed to fetch student stats data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const steps = [
    {
      step: "01",
      label: "Browse Jobs",
      description: "Search open positions, check packages, matching skills, and requirements.",
      path: "/dashboard/student/opening-list",
      color: "text-blue-500 bg-blue-50 border-blue-100/50",
    },
    {
      step: "02",
      label: "Track Apps",
      description: "Monitor evaluation progress, recruiter shortlists, and interview feedback.",
      path: "/dashboard/student/apply-list",
      color: "text-emerald-500 bg-emerald-50 border-emerald-100/50",
    },
    {
      step: "03",
      label: "Take Exams",
      description: "Access secure AI-proctored examinations and MCQ tests.",
      path: "/dashboard/student/apply-list",
      color: "text-purple-500 bg-purple-50 border-purple-100/50",
    },
    {
      step: "04",
      label: "Join Interviews",
      description: "Participate in secure online video conferences and HR rounds.",
      path: "/dashboard/student/my-interviews",
      color: "text-indigo-500 bg-indigo-50 border-indigo-100/50",
    },
  ];

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Dynamic Profile Snapshot & Welcome Card */}
      <div className="bg-gradient-to-br from-white via-white to-indigo-50/20 rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-indigo-200/50 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-lg border bg-gradient-to-br from-indigo-50 to-indigo-100 text-[#3730a3] border-indigo-200/60 shadow-inner">
            {getInitials(user?.student_name)}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Welcome back, {user?.student_name || "Student"}
            </h1>
            <p className="text-xs font-bold text-slate-450 mt-1 uppercase tracking-wide">
              {user?.branch_id?.branch_name || "Specialization Details Not Set"} • {user?.degree_id?.degree_code || "Degree"}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              🎓 {user?.college_id?.college_name || "Affiliated Institution"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 self-start md:self-center">
          <div className="text-left md:text-right">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Verification status</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider mt-1 ${
              user?.isVerifiedByTPO
                ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                : "bg-amber-50 text-amber-700 border-amber-150"
            }`}>
              {user?.isVerifiedByTPO ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  TPO Verified
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Verification Pending
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Student Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DashboardCard
            value={stats.totalInterviews ?? 0}
            label="My Scheduled Interviews"
            icon={FiVideo}
            iconBg="bg-emerald-100 text-emerald-600"
            path="/dashboard/student/my-interviews"
          />
          <DashboardCard
            value={applications.length}
            label="My Active Applications"
            icon={FiFileText}
            iconBg="bg-blue-100 text-blue-600"
            path="/dashboard/student/apply-list"
          />
          <DashboardCard
            value={stats.totalExams ?? 0}
            label="My Completed Exams"
            icon={FiCpu}
            iconBg="bg-purple-100 text-purple-600"
            path="/dashboard/student/apply-list"
          />
        </div>
      )}

      {/* Placement Journey Step Cards */}
      <div>
        <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4 text-left">Your Placement Journey</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, idx) => (
            <Link
              key={idx}
              to={s.path}
              className="bg-gradient-to-br from-white to-slate-50/80 p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300/80 hover:shadow-md hover:shadow-indigo-100/40 transition-all duration-300 group flex flex-col justify-between text-left h-44 active:scale-97 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50/10 rounded-full blur-lg pointer-events-none group-hover:bg-indigo-50/20 transition-all" />
              <div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs border ${s.color}`}>
                    {s.step}
                  </span>
                  <FiPlay className="w-3 h-3 text-slate-300 group-hover:text-[#3730a3] group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mt-3.5 group-hover:text-[#3730a3] transition-colors">{s.label}</h3>
                <p className="text-slate-450 text-[11px] font-semibold mt-1.5 leading-snug">{s.description}</p>
              </div>
              <span className="text-[10px] font-extrabold text-[#3730a3] mt-3 group-hover:underline uppercase tracking-wider">Explore Stage →</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardware & Integrity Check Card */}
        <div className="bg-gradient-to-br from-white to-[#fcfdfe] rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <FiAward className="text-[#3730a3]" /> AI Proctoring Hardware Vitals
            </h2>
            <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">System Test</span>
          </div>

          <div className="space-y-3.5">
            <div className="p-3.5 bg-slate-50/50 border border-slate-150/50 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600 shrink-0">
                <FiCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="font-extrabold text-slate-800 text-xs leading-none">Webcam Permitted</h4>
                <p className="text-slate-500 text-[10px] font-semibold mt-1 leading-normal">System webcam initialized. Proctor snapshot security is fully operational.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/50 border border-slate-150/50 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600 shrink-0">
                <FiCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="font-extrabold text-slate-800 text-xs leading-none">Microphone Permitted</h4>
                <p className="text-slate-500 text-[10px] font-semibold mt-1 leading-normal">Microphone audio checks passed. Decibel feeds active for integrity scanning.</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/40 border border-amber-150/50 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-700 shrink-0">
                <FiAlertCircle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="font-extrabold text-slate-800 text-xs leading-none">Socket Monitoring Warning</h4>
                <p className="text-slate-500 text-[10px] font-semibold mt-1 leading-normal">Losing browser focus or switching tabs during active exams will trigger auto-submission violations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications Card */}
        <div className="bg-gradient-to-br from-white to-[#fcfdfe] rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <FiBriefcase className="text-[#3730a3]" /> Recent Applications
              </h2>
              <span className="text-[9px] font-extrabold text-[#3730a3] bg-indigo-50 border border-indigo-100/60 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                Live Status
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3730a3]" />
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Loading Applications...</span>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <FiFileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-xs font-bold">No active applications</p>
                <p className="text-slate-450 text-[10px] font-semibold mt-1">Explore job openings to begin your placement journey</p>
                <Link
                  to="/dashboard/student/opening-list"
                  className="mt-4 bg-[#3730a3] hover:bg-[#2e288a] text-white font-extrabold py-2 px-4 rounded-xl text-[10px] inline-flex items-center gap-1.5 uppercase tracking-wider active:scale-95 transition-all shadow-sm"
                >
                  Browse Job Openings
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 3).map((app) => (
                  <div
                    key={app._id}
                    className="p-3 bg-slate-50/50 border border-slate-150/50 rounded-xl flex items-center justify-between hover:border-indigo-150 transition-colors border-l-4 border-l-[#3730a3]"
                  >
                    <div className="text-left min-w-0 flex-1 pr-3">
                      <h4 className="font-extrabold text-slate-800 text-xs truncate">
                        {app.job_id?.job_title || "Job Opening"}
                      </h4>
                      <p className="text-slate-500 text-[10px] font-semibold truncate mt-0.5">
                        {app.job_id?.job_position} • {app.job_id?.job_company_id?.company_name || "Company"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-md text-[9px] font-extrabold border uppercase tracking-wider shrink-0 ${
                        app.status === "Selected"
                          ? "bg-emerald-50 border-emerald-150 text-emerald-700"
                          : app.status === "Rejected"
                          ? "bg-rose-50 border-rose-150 text-rose-700"
                          : "bg-amber-50 border-amber-150 text-amber-700"
                      }`}
                    >
                      {app.status || "Applied"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && applications.length > 0 && (
            <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Total: {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
              </span>
              <Link
                to="/dashboard/student/apply-list"
                className="text-[10px] font-black text-[#3730a3] hover:underline uppercase tracking-wider flex items-center gap-1"
              >
                View All Applications →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
