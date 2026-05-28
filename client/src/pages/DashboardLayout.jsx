import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiHome, FiBriefcase, FiUsers, FiBookOpen, FiSettings,
  FiLogOut, FiMenu, FiX, FiUser, FiFileText, FiGrid,
  FiMessageSquare, FiChevronDown, FiVideo, FiLayers, FiDollarSign,
} from "react-icons/fi";
import customFetch from "../utils/customFetch";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await customFetch.get("/login/current-user");
        setUser(data.user);
        setRole(data.role);
      } catch {
        navigate("/sign-in");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await customFetch.get("/login/logout");
      toast.success("Logged out");
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  const getMenuItems = () => {
    const base = [{ path: "/dashboard", icon: <FiHome />, label: "Dashboard" }];
    switch (role) {
      case "Admin":
        return [...base,
          { path: "/dashboard/manage-university", icon: <FiGrid />, label: "Universities" },
          { path: "/dashboard/manage-college", icon: <FiBookOpen />, label: "Colleges" },
          { path: "/dashboard/manage-company", icon: <FiBriefcase />, label: "Companies" },
          { path: "/dashboard/manage-student", icon: <FiUsers />, label: "Students" },
          { path: "/dashboard/manage-tpo", icon: <FiUser />, label: "TPOs" },
          { path: "/dashboard/manage-recruitment-plans", icon: <FiDollarSign />, label: "Recruitment Plans" },
          { path: "/dashboard/contact-list", icon: <FiMessageSquare />, label: "Contacts" },
        ];
      case "Company":
        return [...base,
          { path: "/dashboard/manage-job", icon: <FiBriefcase />, label: "Jobs & Recruitment" },
          { path: "/dashboard/company-interviews", icon: <FiVideo />, label: "Interviews" },
          { path: "/dashboard/recruitment-subscription", icon: <FiLayers />, label: "Subscription" },
          { path: "/dashboard/profile", icon: <FiUser />, label: "Profile" },
        ];
      case "Student":
        return [...base,
          { path: "/dashboard/opening-list", icon: <FiBriefcase />, label: "Job Openings" },
          { path: "/dashboard/apply-list", icon: <FiFileText />, label: "My Applications" },
          { path: "/dashboard/my-interviews", icon: <FiVideo />, label: "My Interviews" },
          { path: "/dashboard/profile", icon: <FiUser />, label: "Profile" },
        ];
      case "College":
      case "University":
      case "TPO":
        return [...base,
          { path: "/dashboard/manage-job", icon: <FiBriefcase />, label: "Jobs" },
          { path: "/dashboard/manage-student", icon: <FiUsers />, label: "Students" },
          { path: "/dashboard/profile", icon: <FiUser />, label: "Profile" },
        ];
      default:
        return base;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-gray-900">The Spot Campus</span>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? "sidebar-link-active" : "sidebar-link"}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <button onClick={handleLogout} className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700">
            <FiLogOut /> <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between sticky top-0 z-40">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <FiMenu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.student_name || user?.company_name || user?.admin_name || user?.college_name || user?.university_name || user?.tpo_name || "User"}</p>
              <p className="text-xs text-gray-500">{role}</p>
            </div>
            <div className="w-9 h-9 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium text-sm">
              {(user?.student_name || user?.company_name || user?.admin_name || "U")[0]}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <Outlet context={{ user, role }} />
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;
