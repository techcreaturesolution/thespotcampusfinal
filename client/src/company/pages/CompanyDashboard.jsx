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
];

const quickLinks = [
  { to: "/dashboard/company/manage-job", state: { openCreateModal: true }, label: "Post Job", icon: FiPlus, color: "text-primary-500" },
  { to: "/dashboard/company/manage-job", label: "Manage Jobs", icon: FiBriefcase, color: "text-purple-500" },
  { to: "/dashboard/company/company-interviews", label: "Interviews", icon: FiVideo, color: "text-indigo-500" },
  { to: "/dashboard/company/recruitment-subscription", label: "Subscription", icon: FiLayers, color: "text-emerald-500" },
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
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md inline-flex items-center gap-2"
          >
            <FiPlus /> Post a New Job
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiSettings className="text-primary-600" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                state={item.state}
                className="p-3 bg-gray-50 hover:bg-primary-50 text-gray-700 hover:text-primary-600 rounded-xl transition border border-gray-100 flex items-center gap-2"
              >
                <item.icon className={`text-lg ${item.color}`} /> {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiCpu className="text-primary-600" /> Recruitment Tools
          </h2>
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
              <div className="w-9 h-9 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center shrink-0">
                <FiFileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">AI MCQ from Job Description</h4>
                <p className="text-gray-500 text-xs mt-1">Generate proctored exams tailored to your JD.</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
              <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <FiTrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Live Proctoring</h4>
                <p className="text-gray-500 text-xs mt-1">Monitor tab switches, camera, and violations in real time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
