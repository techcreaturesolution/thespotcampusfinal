import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiBriefcase,
  FiBookOpen,
  FiFileText,
  FiTrendingUp,
  FiGrid,
  FiUser,
  FiMessageSquare,
  FiDollarSign,
  FiArrowRight,
  FiSettings,
  FiActivity,
  FiClock,
  FiVideo,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import Hero from "../../common/components/Hero";
import DashboardCard from "../../common/components/DashboardCard";

const statConfig = [
  { key: "totalStudents", label: "Students", icon: FiUsers, iconBg: "bg-blue-100 text-blue-600", path: "/dashboard/admin/manage-student" },
  { key: "totalCompanies", label: "Companies", icon: FiBriefcase, iconBg: "bg-purple-100 text-purple-600", path: "/dashboard/admin/manage-company" },
  { key: "totalJobs", label: "Jobs", icon: FiFileText, iconBg: "bg-green-100 text-green-600", path: null },
  { key: "totalApplications", label: "Applications", icon: FiTrendingUp, iconBg: "bg-amber-100 text-amber-650", path: null },
  { key: "totalColleges", label: "Colleges", icon: FiBookOpen, iconBg: "bg-indigo-100 text-indigo-650", path: "/dashboard/admin/manage-college" },
  { key: "totalUniversities", label: "Universities", icon: FiGrid, iconBg: "bg-pink-100 text-pink-600", path: "/dashboard/admin/manage-university" },
  { key: "totalExams", label: "Exams Conducted", icon: FiFileText, iconBg: "bg-teal-100 text-teal-600", path: null },
  { key: "totalPapers", label: "Answer Sheets", icon: FiFileText, iconBg: "bg-orange-100 text-orange-600", path: null },
  { key: "totalTPOs", label: "Registered TPOs", icon: FiUser, iconBg: "bg-teal-100 text-teal-600", path: "/dashboard/admin/manage-tpo" },
  { key: "totalInterviews", label: "Interviews", icon: FiVideo, iconBg: "bg-emerald-100 text-emerald-600", path: null },
  { key: "totalContacts", label: "Contact Inquiries", icon: FiMessageSquare, iconBg: "bg-amber-100 text-amber-600", path: "/dashboard/admin/contact-list" },
];

const quickLinks = [
  { to: "/dashboard/admin/manage-university", label: "Universities", icon: FiGrid, color: "text-primary-500" },
  { to: "/dashboard/admin/manage-college", label: "Colleges", icon: FiBookOpen, color: "text-indigo-500" },
  { to: "/dashboard/admin/manage-company", label: "Companies", icon: FiBriefcase, color: "text-purple-500" },
  { to: "/dashboard/admin/manage-student", label: "Students", icon: FiUsers, color: "text-blue-500" },
  { to: "/dashboard/admin/manage-tpo", label: "TPOs", icon: FiUser, color: "text-teal-500" },
  { to: "/dashboard/admin/manage-recruitment-plans", label: "Recruitment Plans", icon: FiDollarSign, color: "text-emerald-500" },
  { to: "/dashboard/admin/contact-list", label: "Contacts", icon: FiMessageSquare, color: "text-amber-500" },
];

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [activeTab, setActiveTab] = useState("jobs");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await customFetch.get("/stats");
        setStats(data.stats);
        setRecentJobs(data.recentJobs || []);
        setRecentApps(data.recentApplications || []);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const name = user?.admin_name || "Administrator";

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 relative">
      <Hero
        label="Admin Console"
        title={`Welcome back, ${name.split(" ")[0]}`}
        subtitle="System-wide overview — universities, colleges, companies, placements, and platform vitals."
        statusText="All systems operational"
      />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statConfig.map(({ key, label, icon, iconBg, path }) => (
            <DashboardCard
              key={key}
              value={stats[key] ?? 0}
              label={label}
              icon={icon}
              iconBg={iconBg}
              path={path}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions Card */}
        <div className="bg-gradient-to-br from-white to-[#fcfdfe] rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <FiSettings className="text-[#3730a3]" /> Quick Shortcuts
          </h2>
          <div className="grid grid-cols-2 gap-3.5 text-sm font-semibold">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="p-3.5 bg-slate-50/60 hover:bg-[#3730a3] border border-slate-200/70 hover:border-[#3730a3] text-slate-700 hover:text-white rounded-xl shadow-xs hover:shadow-md flex items-center gap-3.5 font-bold transition-all duration-200 group active:scale-97"
              >
                <div className={`w-8 h-8 rounded-lg bg-white shadow-xs group-hover:bg-white/10 flex items-center justify-center transition-colors duration-200`}>
                  <item.icon className={`text-base ${item.color} group-hover:text-white`} />
                </div>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-gradient-to-br from-white to-[#fcfdfe] rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3.5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FiActivity className="text-[#3730a3]" /> Recent Activity
            </h2>
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("jobs")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeTab === "jobs"
                    ? "bg-white text-[#3730a3] shadow-xs"
                    : "text-slate-700 hover:text-slate-850"
                }`}
              >
                Jobs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("apps")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeTab === "apps"
                    ? "bg-white text-[#3730a3] shadow-xs"
                    : "text-slate-700 hover:text-slate-850"
                }`}
              >
                Applications
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[260px] pr-1">
            {activeTab === "jobs" ? (
              recentJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                  No recent job postings found.
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div key={job._id} className="flex items-center justify-between p-3.5 bg-slate-50/40 hover:bg-[#f8f9ff]/70 rounded-xl border border-slate-100 hover:border-indigo-100/50 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-[#3730a3] flex items-center justify-center font-bold text-xs border border-indigo-100/60 uppercase">
                        {job.job_company_id?.company_name?.substring(0, 2) || "CO"}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-extrabold text-slate-850 leading-tight">
                          {job.job_title}
                        </p>
                        <p className="text-[10px] font-bold text-slate-450 mt-0.5">
                          {job.job_company_id?.company_name || "Unknown Company"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2 py-0.5 text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100/50 rounded-md uppercase">
                        {job.job_type || "Full-Time"}
                      </span>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1 justify-end">
                        <FiClock className="w-2.5 h-2.5" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )
            ) : (
              recentApps.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                  No recent student applications found.
                </div>
              ) : (
                recentApps.map((app) => (
                  <div key={app._id} className="flex items-center justify-between p-3.5 bg-slate-50/40 hover:bg-[#f8f9ff]/70 rounded-xl border border-slate-100 hover:border-indigo-100/50 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100/60 uppercase">
                        {app.student_id?.student_name?.substring(0, 2) || "ST"}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-extrabold text-slate-850 leading-tight">
                          {app.student_id?.student_name || "Unknown Student"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-450 mt-0.5">
                          Applied for {app.job_id?.job_title || "Unknown Job"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase border ${
                        app.final_result === "selected"
                          ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                          : app.final_result === "rejected"
                          ? "bg-rose-50 border-rose-250 text-rose-700"
                          : "bg-amber-50 border-amber-250 text-amber-700"
                      }`}>
                        {app.final_result || "Pending"}
                      </span>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1 justify-end">
                        <FiClock className="w-2.5 h-2.5" />
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
