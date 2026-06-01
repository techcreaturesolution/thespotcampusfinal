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
    <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between sticky top-0 z-40">
      <button
        type="button"
        className="lg:hidden p-2.5 text-gray-600 hover:text-gray-950 hover:bg-gray-50 border border-gray-200/80 rounded-xl transition-all duration-200 focus:outline-none active:scale-95 shadow-sm bg-white"
        onClick={() => setSidebarOpen(true)}
      >
        <FiMenu className="w-5.5 h-5.5" />
      </button>
      <div className="flex items-center gap-3 ml-auto">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
        <Link
          to={profilePath}
          title="View Profile"
          className="w-9 h-9 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium text-sm overflow-hidden border border-gray-200 hover:border-primary-500 hover:ring-2 hover:ring-primary-500/20 transition-all shadow-sm hover:scale-105 active:scale-95 duration-200"
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
