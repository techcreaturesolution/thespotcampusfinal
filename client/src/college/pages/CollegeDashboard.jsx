import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiBriefcase,
  FiUser,
  FiAward,
  FiSettings,
  FiArrowRight,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import Hero from "../../common/components/Hero";
import DashboardCard from "../../common/components/DashboardCard";

const statConfig = [
  { key: "totalStudents", label: "Students", icon: FiUsers, iconBg: "bg-blue-100 text-blue-600", path: "/dashboard/college/manage-student" },
  { key: "totalJobs", label: "Openings", icon: FiBriefcase, iconBg: "bg-purple-100 text-purple-600", path: "/dashboard/college/manage-job" },
  { key: "totalApplications", label: "Applications", icon: FiAward, iconBg: "bg-amber-100 text-amber-600", path: null },
  { key: "totalExams", label: "Exams", icon: FiAward, iconBg: "bg-teal-100 text-teal-600", path: null },
];

const quickLinks = [
  { to: "/dashboard/college/manage-student", label: "Students", icon: FiUsers, color: "text-blue-500" },
  { to: "/dashboard/college/manage-job", label: "Jobs", icon: FiBriefcase, color: "text-purple-500" },
  { to: "/dashboard/college/profile", label: "Profile", icon: FiUser, color: "text-emerald-500" },
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
      <Hero
        label="College Panel"
        title={`Welcome back, ${name.split(" ")[0]}`}
        subtitle="Track students, placement openings, and coordinate department placement activities."
        statusText="Placement season active"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-semibold">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="p-3 bg-gray-50 hover:bg-primary-50 text-gray-700 hover:text-primary-600 rounded-xl transition border border-gray-100 flex items-center gap-2"
              >
                <item.icon className={`text-lg ${item.color}`} /> {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center p-8 bg-gradient-to-br from-primary-50 via-white to-indigo-50/30">
          <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
            <FiAward className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Department Coordination</h3>
          <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
            Guide placement coordinators and ensure students are mapped to eligibility criteria for campus drives and proctored assessments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollegeDashboard;
