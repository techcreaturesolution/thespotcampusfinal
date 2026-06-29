import React from "react";
import { Link } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

const DashboardNavbar = ({ user, role, setSidebarOpen }) => {
  const displayName =
    user?.student_name ||
    user?.company_name ||
    user?.admin_name ||
    user?.college_name ||
    user?.university_name ||
    user?.tpo_name ||
    "User";

  const profilePhoto =
    user?.admin_image ||
    user?.student_image ||
    user?.company_logo ||
    user?.college_logo ||
    user?.university_logo ||
    user?.tpo_image;

  const profilePath = `/dashboard/${role?.toLowerCase()}/profile`;

  return (
    <header className="bg-[#f8f9ff]/85 backdrop-blur-md border-b border-slate-200/60 px-6 h-16 flex items-center justify-between sticky top-0 z-40">
      <button
        type="button"
        aria-label="Open sidebar"
        className="lg:hidden p-2.5 text-[#3730a3] hover:text-[#2563eb] hover:bg-indigo-50/50 border border-slate-200/50 rounded-xl transition-all duration-200 focus:outline-none active:scale-95 shadow-sm bg-white"
        onClick={() => setSidebarOpen(true)}
      >
        <FiMenu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-3.5 ml-auto">
        <div className="text-right">
          <p className="text-sm font-bold text-slate-800">{displayName}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#3730a3] mt-0.5">{role}</p>
        </div>
        <Link
          to={profilePath}
          title="View Profile"
          className="w-9 h-9 bg-indigo-50 text-[#3730a3] rounded-full flex items-center justify-center font-bold text-sm overflow-hidden border border-slate-200 hover:border-[#3730a3] hover:ring-4 hover:ring-indigo-500/10 transition-all shadow-sm hover:scale-105 active:scale-95 duration-200"
        >
          {profilePhoto ? (
            <img src={profilePhoto} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            (displayName || "U")[0].toUpperCase()
          )}
        </Link>
      </div>
    </header>
  );
};

export default DashboardNavbar;
