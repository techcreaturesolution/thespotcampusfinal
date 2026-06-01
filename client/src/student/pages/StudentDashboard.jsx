import React from "react";
import { useOutletContext, Link } from "react-router-dom";
import { FiBriefcase, FiFileText, FiVideo, FiUser, FiAward, FiInfo } from "react-icons/fi";
import DashboardCard from "../../common/components/DashboardCard";

const StudentDashboard = ({ user: propUser }) => {
  const outletContext = useOutletContext() || {};
  const user = propUser || outletContext.user;

  const cardConfig = [
    {
      label: "Job Openings",
      description: "Search through thousands of live openings and check detailed requirements.",
      icon: FiBriefcase,
      iconBg: "bg-blue-50 text-blue-600",
      path: "/dashboard/student/opening-list",
      actionText: "Browse Jobs \u2192",
    },
    {
      label: "Applications",
      description: "Track the active evaluation status of your submitted job applications.",
      icon: FiFileText,
      iconBg: "bg-emerald-50 text-emerald-600",
      path: "/dashboard/student/apply-list",
      actionText: "View Applications \u2192",
    },
    {
      label: "My Interviews",
      description: "Join live screening proctored rounds and check scheduled slots.",
      icon: FiVideo,
      iconBg: "bg-purple-50 text-purple-600",
      path: "/dashboard/student/my-interviews",
      actionText: "Join Interview Room \u2192",
    },
    {
      label: "My Profile",
      description: "Update your details, enrollment numbers, academic lists, and skills.",
      icon: FiUser,
      iconBg: "bg-amber-50 text-amber-600",
      path: "/dashboard/student/profile",
      actionText: "Edit Profile \u2192",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Student Dashboard</h1>
        <p className="text-gray-500 mt-1 font-medium">Welcome back, {user?.student_name || "Student"}. Shape your profile and prepare for examinations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {cardConfig.map((card, idx) => (
          <DashboardCard
            key={idx}
            label={card.label}
            description={card.description}
            icon={card.icon}
            iconBg={card.iconBg}
            path={card.path}
            actionText={card.actionText}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiAward className="text-primary-600" /> Evaluation and AI-Proctoring Guidelines
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
              <FiInfo className="text-primary-500 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900 text-xs">Verify Camera & Mic Permissions</h4>
                <p className="text-gray-500 text-xxs mt-0.5 leading-relaxed">Before entering an exam room, ensure your hardware permissions are fully approved for proctor feeds.</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
              <FiInfo className="text-indigo-500 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900 text-xs">Tab Switches Lead to Auto-Submission</h4>
                <p className="text-gray-500 text-xxs mt-0.5 leading-relaxed">The exam socket monitors dynamic focus actions. Minimizing the tab will trigger proctoring violations.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 p-6 bg-gradient-to-br from-primary-600 to-indigo-600 text-white rounded-3xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-xl" />
          <div>
            <span className="bg-white/20 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Candidate Quick Link</span>
            <h3 className="text-xl font-bold mt-3 text-white">Ready for evaluation?</h3>
            <p className="text-white/80 text-xs mt-1.5 leading-relaxed max-w-sm">Use your dynamic candidate portal to apply, clear exams, and check proctored feedback in real-time.</p>
          </div>
          <Link to="/dashboard/student/opening-list" className="btn bg-white text-primary-600 hover:bg-slate-50 border-none font-bold py-2.5 px-5 rounded-xl transition duration-150 inline-flex items-center justify-center gap-1.5 self-start mt-6 text-xs">
            Start Applying
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
