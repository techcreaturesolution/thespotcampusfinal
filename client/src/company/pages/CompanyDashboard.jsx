import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiVideo,
  FiLayers,
  FiFileText,
  FiPlus,
  FiCpu,
  FiTrendingUp,
  FiUsers,
  FiSettings,
  FiArrowRight,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import Hero from "../../common/components/Hero";
import DashboardCard from "../../common/components/DashboardCard";

const statConfig = [
  { key: "totalJobs", label: "Open Jobs", icon: FiBriefcase, iconBg: "bg-purple-100 text-purple-600", path: "/dashboard/company/manage-job" },
  { key: "totalApplications", label: "Applications", icon: FiFileText, iconBg: "bg-amber-100 text-amber-600", path: null },
  { key: "totalStudents", label: "Students Pool", icon: FiUsers, iconBg: "bg-blue-100 text-blue-600", path: null },
  { key: "totalExams", label: "Exams", icon: FiCpu, iconBg: "bg-teal-100 text-teal-600", path: null },
  { key: "totalInterviews", label: "Scheduled Interviews", icon: FiVideo, iconBg: "bg-emerald-100 text-emerald-600", path: "/dashboard/company/company-interviews" },
];

const quickLinks = [
  { to: "/dashboard/company/manage-job", state: { openCreateModal: true }, label: "Post Job", icon: FiPlus, color: "text-primary-500" },
  { to: "/dashboard/company/manage-job", label: "Manage Jobs", icon: FiBriefcase, color: "text-purple-500" },
  { to: "/dashboard/company/company-interviews", label: "Interviews", icon: FiVideo, color: "text-indigo-500" },
  { to: "/dashboard/company/profile", label: "Profile", icon: FiSettings, color: "text-gray-500" },
];

const CompanyDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await customFetch.get("/stats");
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const name = user?.company_name || "Recruiter";

  if (loading) return <Loading />;

  return (
    <div className="space-y-8">
      <Hero
        label="Company Panel"
        title={`Welcome back, ${name.split(" ")[0]}`}
        subtitle="Manage job postings, conduct interviews, and track your recruitment pipeline."
        action={
          <Link
            to="/dashboard/company/manage-job"
            state={{ openCreateModal: true }}
            className="vibrant-btn text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 hover:opacity-95 active:scale-95 inline-flex items-center gap-2 shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 text-sm"
          >
            <FiPlus className="w-4 h-4" /> Post a New Job
          </Link>
        }
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
                key={item.label}
                to={item.to}
                state={item.state}
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

        {/* Recruitment Tools Card */}
        <div className="bg-gradient-to-br from-white to-[#fcfdfe] rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <FiCpu className="text-[#3730a3]" /> Recruitment Tools
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-200/50 hover:border-indigo-250/70 flex items-start gap-3.5 transition-all duration-200 shadow-xs hover:shadow-sm">
              <div className="w-9 h-9 bg-white text-[#3730a3] border border-slate-100 shadow-xs rounded-lg flex items-center justify-center shrink-0">
                <FiFileText className="w-4.5 h-4.5 text-[#3730a3]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800 text-sm">AI MCQ from Job Description</h4>
                <p className="text-slate-500 text-xs mt-1 leading-normal">Generate proctored exams tailored to your JD instantly.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-200/50 hover:border-indigo-250/70 flex items-start gap-3.5 transition-all duration-200 shadow-xs hover:shadow-sm">
              <div className="w-9 h-9 bg-white text-indigo-600 border border-slate-100 shadow-xs rounded-lg flex items-center justify-center shrink-0">
                <FiTrendingUp className="w-4.5 h-4.5 text-[#2563eb]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800 text-sm">Live Proctoring Panel</h4>
                <p className="text-slate-500 text-xs mt-1 leading-normal">Monitor browser tab locks, camera snapshots, and violations in real time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
