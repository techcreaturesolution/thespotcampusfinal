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
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import Hero from "../../common/components/Hero";
import DashboardCard from "../../common/components/DashboardCard";

const statConfig = [
  { key: "totalStudents", label: "Students", icon: FiUsers, iconBg: "bg-blue-100 text-blue-600", path: "/dashboard/admin/manage-student" },
  { key: "totalCompanies", label: "Companies", icon: FiBriefcase, iconBg: "bg-purple-100 text-purple-600", path: "/dashboard/admin/manage-company" },
  { key: "totalJobs", label: "Jobs", icon: FiFileText, iconBg: "bg-green-100 text-green-600", path: null },
  { key: "totalApplications", label: "Applications", icon: FiTrendingUp, iconBg: "bg-amber-100 text-amber-600", path: null },
  { key: "totalColleges", label: "Colleges", icon: FiBookOpen, iconBg: "bg-indigo-100 text-indigo-600", path: "/dashboard/admin/manage-college" },
  { key: "totalUniversities", label: "Universities", icon: FiGrid, iconBg: "bg-pink-100 text-pink-600", path: "/dashboard/admin/manage-university" },
  { key: "totalExams", label: "Exams Conducted", icon: FiFileText, iconBg: "bg-teal-100 text-teal-600", path: null },
  { key: "totalPapers", label: "Answer Sheets", icon: FiFileText, iconBg: "bg-orange-100 text-orange-600", path: null },
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

  const name = user?.admin_name || "Administrator";

  if (loading) return <Loading />;

  return (
    <div className="space-y-8">
      <Hero
        label="Admin Console"
        title={`Welcome back, ${name.split(" ")[0]}`}
        subtitle="System-wide overview — users, placements, exams, and platform health."
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiSettings className="text-primary-600" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center text-center p-8 bg-gradient-to-br from-primary-50 via-white to-indigo-50/30">
          <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <FiSettings className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Platform Status</h3>
          <p className="text-gray-500 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
            Verification, role matching, and proctoring integrations are running normally.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
