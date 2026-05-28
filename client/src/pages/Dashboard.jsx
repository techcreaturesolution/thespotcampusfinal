import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FiUsers, FiBriefcase, FiBookOpen, FiFileText, FiTrendingUp } from "react-icons/fi";
import customFetch from "../utils/customFetch";

const Dashboard = () => {
  const { user, role } = useOutletContext();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await customFetch.get("/stats");
        setStats(data.stats);
      } catch {
        // Stats may not be available for all roles
      }
    };
    fetchStats();
  }, []);

  const statCards = stats ? [
    { label: "Students", value: stats.totalStudents, icon: <FiUsers />, color: "bg-blue-100 text-blue-600" },
    { label: "Companies", value: stats.totalCompanies, icon: <FiBriefcase />, color: "bg-purple-100 text-purple-600" },
    { label: "Jobs", value: stats.totalJobs, icon: <FiFileText />, color: "bg-green-100 text-green-600" },
    { label: "Applications", value: stats.totalApplications, icon: <FiTrendingUp />, color: "bg-amber-100 text-amber-600" },
    { label: "Colleges", value: stats.totalColleges, icon: <FiBookOpen />, color: "bg-indigo-100 text-indigo-600" },
    { label: "Universities", value: stats.totalUniversities, icon: <FiBookOpen />, color: "bg-pink-100 text-pink-600" },
    { label: "Exams", value: stats.totalExams, icon: <FiFileText />, color: "bg-teal-100 text-teal-600" },
    { label: "Submissions", value: stats.totalPapers, icon: <FiFileText />, color: "bg-orange-100 text-orange-600" },
  ] : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.student_name || user?.company_name || user?.admin_name || user?.college_name || user?.university_name || user?.tpo_name || "User"}
        </h1>
        <p className="text-gray-500 mt-1">Here's your dashboard overview</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <p className="text-gray-500">Use the sidebar navigation to access all features of The Spot Campus platform.</p>
      </div>
    </div>
  );
};

export default Dashboard;
