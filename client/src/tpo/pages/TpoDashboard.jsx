import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiBriefcase,
  FiUser,
  FiTrendingUp,
  FiSettings,
  FiArrowRight,
  FiVideo,
  FiBookOpen,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import Hero from "../../common/components/Hero";
import DashboardCard from "../../common/components/DashboardCard";

const statConfig = [
  { key: "totalStudents", label: "Candidates", icon: FiUsers, iconBg: "bg-blue-100 text-blue-600", path: "/dashboard/tpo/manage-student" },
  { key: "totalJobs", label: "Vacancies", icon: FiBriefcase, iconBg: "bg-purple-100 text-purple-600", path: "/dashboard/tpo/manage-job" },
  { key: "totalApplications", label: "Applications", icon: FiTrendingUp, iconBg: "bg-amber-100 text-amber-600", path: null },
  { key: "totalCompanies", label: "Companies", icon: FiBriefcase, iconBg: "bg-indigo-100 text-indigo-600", path: null },
  { key: "totalInterviews", label: "Scheduled Interviews", icon: FiVideo, iconBg: "bg-emerald-100 text-emerald-600", path: null },
  { key: "totalDegrees", label: "Offered Degrees", icon: FiBookOpen, iconBg: "bg-pink-100 text-pink-650", path: null },
];

const quickLinks = [
  { to: "/dashboard/tpo/manage-student", label: "Students", icon: FiUsers, color: "text-blue-500" },
  { to: "/dashboard/tpo/manage-job", label: "Openings", icon: FiBriefcase, color: "text-purple-500" },
  { to: "/dashboard/tpo/profile", label: "Profile", icon: FiUser, color: "text-emerald-500" },
  { to: "/dashboard/tpo", label: "Dashboard", icon: FiTrendingUp, color: "text-indigo-500" },
];

const TpoDashboard = ({ user }) => {
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

  const name = user?.tpo_name || "TPO";
  const degreeName = user?.tpo_degree_id?.degree_name || "";
  const collegeName = user?.tpo_college_id?.college_name || "";
  const universityName = user?.tpo_college_id?.college_university_id?.university_name || "";

  if (loading) return <Loading />;

  const detailsParts = [];
  if (degreeName) detailsParts.push(`TPO for ${degreeName}`);
  if (collegeName) detailsParts.push(collegeName);
  if (universityName) detailsParts.push(universityName);

  const subtitleText = detailsParts.length > 0
    ? `${detailsParts.join(" | ")} — Bridge recruiters and students, manage candidates and track placement openings.`
    : "Bridge recruiters and students — manage candidates and track placement openings.";

  return (
    <div className="space-y-8">
      <Hero
        label={degreeName ? `TPO Panel • ${degreeName}` : "TPO Panel"}
        title={`Welcome back, ${name.split(" ")[0]}`}
        subtitle={subtitleText}
        statusText={degreeName ? `${degreeName} Active` : "Coordination active"}
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
        {/* Quick Shortcuts */}
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
                <div className="w-8 h-8 rounded-lg bg-white shadow-xs group-hover:bg-white/10 flex items-center justify-center transition-colors duration-200">
                  <item.icon className={`text-base ${item.color} group-hover:text-white`} />
                </div>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Placement Tools Card */}
        <div className="bg-gradient-to-br from-white to-[#fcfdfe] rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <FiTrendingUp className="text-[#3730a3]" /> Placement Tools
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-200/50 hover:border-indigo-250/70 flex items-start gap-3.5 transition-all duration-200 shadow-xs hover:shadow-sm">
              <div className="w-9 h-9 bg-white text-[#3730a3] border border-slate-100 shadow-xs rounded-lg flex items-center justify-center shrink-0">
                <FiBriefcase className="w-4.5 h-4.5 text-[#3730a3]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800 text-sm">Recruitment Pipeline</h4>
                <p className="text-slate-500 text-xs mt-1 leading-normal">Review verified campus drives, register candidates, and coordinate selection rounds.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-200/50 hover:border-indigo-250/70 flex items-start gap-3.5 transition-all duration-200 shadow-xs hover:shadow-sm">
              <div className="w-9 h-9 bg-white text-[#3730a3] border border-slate-100 shadow-xs rounded-lg flex items-center justify-center shrink-0">
                <FiUsers className="w-4.5 h-4.5 text-[#3730a3]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800 text-sm">Student Profiles</h4>
                <p className="text-slate-500 text-xs mt-1 leading-normal">Track and update resumes, branch allocations, and academic standings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TpoDashboard;
