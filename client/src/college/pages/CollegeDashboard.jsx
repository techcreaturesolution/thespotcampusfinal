import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers, FiBriefcase, FiUser, FiAward, FiSettings, FiArrowRight, FiBookOpen, FiActivity, FiCpu, FiVideo
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import Hero from "../../common/components/Hero";
import DashboardCard from "../../common/components/DashboardCard";

const statConfig = [
  { key: "totalStudents", label: "Students", icon: FiUsers, iconBg: "bg-blue-100 text-blue-650", path: "/dashboard/college/manage-student" },
  { key: "totalJobs", label: "Openings", icon: FiBriefcase, iconBg: "bg-purple-100 text-purple-650", path: "/dashboard/college/manage-job" },
  { key: "totalApplications", label: "Applications", icon: FiAward, iconBg: "bg-amber-100 text-amber-650", path: null },
  { key: "totalExams", label: "Exams", icon: FiCpu, iconBg: "bg-teal-100 text-teal-650", path: null },
  { key: "totalBranches", label: "Registered Branches", icon: FiCpu, iconBg: "bg-indigo-100 text-indigo-650", path: "/dashboard/college/manage-branch" },
  { key: "totalDegrees", label: "Degrees Offered", icon: FiBookOpen, iconBg: "bg-pink-100 text-pink-650", path: "/dashboard/college/manage-degree" },
  { key: "totalTPOs", label: "Placement TPOs", icon: FiUser, iconBg: "bg-teal-100 text-teal-650", path: "/dashboard/college/manage-tpo" },
  { key: "totalInterviews", label: "Scheduled Interviews", icon: FiVideo, iconBg: "bg-emerald-100 text-emerald-650", path: null },
];

const quickLinks = [
  { to: "/dashboard/college/manage-student", label: "Students", icon: FiUsers, color: "text-blue-500" },
  { to: "/dashboard/college/manage-job", label: "Jobs Catalog", icon: FiBriefcase, color: "text-purple-500" },
  { to: "/dashboard/college/manage-tpo", label: "Manage TPOs", icon: FiUser, color: "text-[#3730a3]" },
  { to: "/dashboard/college/manage-degree", label: "Degrees", icon: FiBookOpen, color: "text-amber-500" },
  { to: "/dashboard/college/profile", label: "Profile", icon: FiSettings, color: "text-gray-500" },
];

const CollegeDashboard = ({ user }) => {
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

  const name = user?.college_name || "College";

  if (loading) return <Loading />;

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <Hero
        label="College Panel"
        title={`Welcome back, ${name.split(" ")[0]}`}
        subtitle="Manage student placement records, review job openings, and assign placement coordinators."
        statusText="Placement season active"
      />

      {/* Stats Cards grid */}
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

      {/* Shortcuts and Tools grid */}
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
            <FiActivity className="text-[#3730a3]" /> Placement Coordination
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-200/50 hover:border-indigo-250/70 flex items-start gap-3.5 transition-all duration-200 shadow-xs hover:shadow-sm">
              <div className="w-9 h-9 bg-white text-[#3730a3] border border-slate-100 shadow-xs rounded-lg flex items-center justify-center shrink-0">
                <FiBookOpen className="w-4.5 h-4.5 text-[#3730a3]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800 text-sm">Academic Catalog</h4>
                <p className="text-slate-500 text-xs mt-1 leading-normal">Track branch specializations, semesters, and degrees offered by your college.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-200/50 hover:border-indigo-250/70 flex items-start gap-3.5 transition-all duration-200 shadow-xs hover:shadow-sm">
              <div className="w-9 h-9 bg-white text-indigo-650 border border-slate-100 shadow-xs rounded-lg flex items-center justify-center shrink-0">
                <FiUsers className="w-4.5 h-4.5 text-[#2563eb]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800 text-sm">Placement Officers (TPOs)</h4>
                <p className="text-slate-500 text-xs mt-1 leading-normal">Assign placement officers to monitor and verify student applications for active corporate openings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeDashboard;
