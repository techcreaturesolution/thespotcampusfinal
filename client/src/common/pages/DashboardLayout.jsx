import React, { useState, useEffect, Suspense } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import {
  FiHome, FiBriefcase, FiUsers, FiBookOpen,
  FiLogOut, FiMenu, FiX, FiUser, FiFileText, FiGrid,
  FiMessageSquare, FiVideo, FiLayers, FiDollarSign, FiCpu, FiBook,
  FiBookmark, FiChevronDown, FiChevronUp,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import AdminDashboard from "../../admin/pages/AdminDashboard";
import CompanyDashboard from "../../company/pages/CompanyDashboard";
import StudentDashboard from "../../student/pages/StudentDashboard";
import UniversityDashboard from "../../university/pages/UniversityDashboard";
import CollegeDashboard from "../../college/pages/CollegeDashboard";
import TpoDashboard from "../../tpo/pages/TpoDashboard";
import DashboardNavbar from "../components/DashboardNavbar";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await customFetch.get("/login/current-user");
        setUser(data.user);
        setRole(data.role);
      } catch {
        navigate("/sign-in");
      } finally {
        setLoading(false);
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
        { path: "/dashboard/admin/manage-university", icon: <FiGrid />, label: "Universities" },
        { path: "/dashboard/admin/manage-college", icon: <FiBookOpen />, label: "Colleges" },
        { path: "/dashboard/admin/manage-company", icon: <FiBriefcase />, label: "Companies" },
        { path: "/dashboard/admin/manage-student", icon: <FiUsers />, label: "Students" },
        { path: "/dashboard/admin/manage-tpo", icon: <FiUser />, label: "TPOs" },
        { path: "/dashboard/admin/manage-recruitment-plans", icon: <FiDollarSign />, label: "Subscription Plans" },
        {
          label: "Preparation",
          icon: <FiBook />,
          children: [
            { path: "/dashboard/admin/preparation/subjects", label: "Subjects" },
            { path: "/dashboard/admin/preparation/questions", label: "Questions" },
            { path: "/dashboard/admin/preparation/mock-tests", label: "Mock Tests" },
            { path: "/dashboard/admin/preparation/pdfs", label: "PDF Materials" },
          ]
        },
        { path: "/dashboard/admin/manage-cv-templates", icon: <FiFileText />, label: "CV Templates" },
        { path: "/dashboard/admin/contact-list", icon: <FiMessageSquare />, label: "Contacts" },
        { path: "/dashboard/admin/reports", icon: <FiFileText />, label: "Reports" },
        ];
      case "Company":
        return [...base,
        { path: "/dashboard/company/manage-job", icon: <FiBriefcase />, label: "Jobs & Recruitment" },
        { path: "/dashboard/company/applicants", icon: <FiUsers />, label: "Applicants" },
        { path: "/dashboard/company/company-interviews", icon: <FiVideo />, label: "Interviews" },
        ];
      case "Student":
        return [...base,
        { path: "/dashboard/student/opening-list", icon: <FiBriefcase />, label: "Job Openings" },
        { path: "/dashboard/student/apply-list", icon: <FiFileText />, label: "My Applications" },
        { path: "/dashboard/student/preparation", icon: <FiBook />, label: "Preparation" },
        { path: "/dashboard/student/ai-cv-builder", icon: <FiFileText />, label: "AI CV Builder" },
        { path: "/dashboard/student/my-interviews", icon: <FiVideo />, label: "My Interviews" },
        { path: "/dashboard/student/preparation/bookmarks", icon: <FiBookmark />, label: "Saved Items" },
        { path: "/dashboard/student/plans", icon: <FiDollarSign />, label: "Subscription Plans" },
        ];
      case "College":
        return [...base,
        { path: "/dashboard/college/manage-job", icon: <FiBriefcase />, label: "Jobs" },
        { path: "/dashboard/college/manage-student", icon: <FiUsers />, label: "Students" },
        { path: "/dashboard/college/applications", icon: <FiUsers />, label: "Applicants" },
        { path: "/dashboard/college/manage-degree", icon: <FiBookOpen />, label: "Degrees" },
        { path: "/dashboard/college/manage-branch", icon: <FiCpu />, label: "Branches" },
        { path: "/dashboard/college/manage-tpo", icon: <FiUser />, label: "Manage TPO" },
        ];
      case "University":
        return [...base,
        { path: "/dashboard/university/manage-college", icon: <FiGrid />, label: "Colleges" },
        { path: "/dashboard/university/manage-job", icon: <FiBriefcase />, label: "Jobs" },
        { path: "/dashboard/university/manage-student", icon: <FiUsers />, label: "Students" },
        { path: "/dashboard/university/manage-degree", icon: <FiBookOpen />, label: "Degrees & Branches" },
        ];
      case "TPO":
        return [...base,
        { path: "/dashboard/tpo/manage-job", icon: <FiBriefcase />, label: "Jobs" },
        { path: "/dashboard/tpo/manage-student", icon: <FiUsers />, label: "Students" },
        { path: "/dashboard/tpo/applications", icon: <FiUsers />, label: "Applicants" },
        ];
      default:
        return base;
    }
  };

  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const activeSubmenu = {};
    const items = getMenuItems();
    items.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => location.pathname === child.path);
        if (hasActiveChild) {
          activeSubmenu[item.label] = true;
        }
      }
    });
    setExpandedMenus(prev => ({ ...prev, ...activeSubmenu }));
  }, [location.pathname, role]);

  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleParentClick = (item) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedMenus(prev => ({ ...prev, [item.label]: true }));
    } else {
      toggleSubmenu(item.label);
    }
  };

  const renderDashboard = () => {
    switch (role) {
      case "Admin":
        return <AdminDashboard user={user} role={role} />;
      case "Company":
        return <CompanyDashboard user={user} />;
      case "Student":
        return <StudentDashboard user={user} role={role} />;
      case "University":
        return <UniversityDashboard user={user} />;
      case "College":
        return <CollegeDashboard user={user} />;
      case "TPO":
        return <TpoDashboard user={user} />;
      default:
        return (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto mt-10">
            <p className="text-red-500 font-bold text-lg">Invalid Role</p>
            <p className="text-gray-500 text-sm mt-1">Please log in with a valid account or contact system support.</p>
          </div>
        );
    }
  };

  const reloadUser = async () => {
    try {
      const { data } = await customFetch.get("/login/current-user");
      setUser(data.user);
      setRole(data.role);
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = getMenuItems();
  const displayName =
    user?.student_name || user?.company_name || user?.admin_name ||
    user?.college_name || user?.university_name || user?.tpo_name || "User";

  const profilePhoto =
    user?.admin_image ||
    user?.student_image ||
    user?.company_logo ||
    user?.college_logo ||
    user?.university_logo ||
    user?.tpo_image;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center relative overflow-hidden">
        <div className="fixed top-10 left-10 w-96 h-96 bg-blue-400/5 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-10 right-10 w-96 h-96 bg-indigo-400/5 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="flex flex-col items-center gap-3 relative z-10">
          <div className="w-10 h-10 border-4 border-[#3730a3] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#3730a3] text-sm font-bold tracking-wide uppercase animate-pulse">Loading Portal...</p>
        </div>
      </div>
    );
  }

  const isVideoRoom = location.pathname.includes("/video-interview/");

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col md:flex-row relative selection:bg-[#3730a3] selection:text-white">
      {!isVideoRoom && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 border-r border-slate-200/60 bg-[#f1f3f9]/90 backdrop-blur-lg transform transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "lg:w-16 w-56" : "w-56"}`}
        >
        <div className={`flex items-center ${isCollapsed ? "lg:flex-col lg:justify-center lg:gap-2 lg:py-4 lg:px-0 lg:h-auto px-4 h-16 justify-between" : "px-5 h-16 justify-between"} border-b border-slate-200/50`}>
          {!isCollapsed ? (
            <img src="/logo_TSC.png" alt="The Spot Campus" width="143" height="44" className="h-11 object-contain transition-all duration-300" />
          ) : (
            <div className="w-[32px] h-[32px] flex items-center justify-center rounded-lg flex-shrink-0" title="The Spot Campus">
              <img src="/logo_TCS2.png" alt="The Spot Campus" className="w-8 h-8 object-contain" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-slate-900 transition-all duration-200 ${isCollapsed ? "mt-1 mx-auto" : "ml-auto"}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <button className="lg:hidden ml-auto" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            if (item.children) {
              const isExpanded = expandedMenus[item.label];
              const hasActiveChild = item.children.some(child => location.pathname === child.path);

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleParentClick(item)}
                    className={
                      hasActiveChild
                        ? `flex items-center justify-between w-full ${isCollapsed ? "lg:justify-center lg:gap-0 lg:px-2 lg:py-3 border-l-4 border-[#3730a3]" : "gap-3 px-4 py-2.5 border-l-4 border-[#3730a3]"} rounded-xl bg-white text-[#3730a3] font-bold shadow-sm shadow-indigo-500/5 transition-all duration-200`
                        : `flex items-center justify-between w-full ${isCollapsed ? "lg:justify-center lg:gap-0 lg:px-2 lg:py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-slate-600 hover:bg-white/60 hover:text-[#3730a3] transition-all duration-200`
                    }
                    title={isCollapsed ? item.label : ""}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isCollapsed ? "text-lg lg:text-xl" : "text-sm"}>{item.icon}</span>
                      <span className={`text-sm transition-all duration-200 whitespace-nowrap ${isCollapsed ? "lg:w-0 lg:opacity-0 lg:hidden block" : "w-auto opacity-100 block"}`}>
                        {item.label}
                      </span>
                    </div>
                    {!isCollapsed && (
                      <span className="text-slate-400">
                        {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                      </span>
                    )}
                  </button>

                  {isExpanded && !isCollapsed && (
                    <div className="pl-9 space-y-1 transition-all duration-200">
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={
                              isChildActive
                                ? "flex items-center gap-3 px-4 py-2 rounded-xl bg-indigo-50 text-[#3730a3] font-bold transition-all duration-200"
                                : "flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 hover:bg-white/40 hover:text-[#3730a3] transition-all duration-200"
                            }
                            onClick={() => setSidebarOpen(false)}
                          >
                            <span className="text-xs">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={
                  location.pathname === item.path
                    ? `flex items-center ${isCollapsed ? "lg:justify-center lg:gap-0 lg:px-2 lg:py-3 border-l-4 border-[#3730a3]" : "gap-3 px-4 py-2.5 border-l-4 border-[#3730a3]"} rounded-xl bg-white text-[#3730a3] font-bold shadow-sm shadow-indigo-500/5 transition-all duration-200`
                    : `flex items-center ${isCollapsed ? "lg:justify-center lg:gap-0 lg:px-2 lg:py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-slate-600 hover:bg-white/60 hover:text-[#3730a3] transition-all duration-200`
                }
                onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? item.label : ""}
              >
                <span className={isCollapsed ? "text-lg lg:text-xl" : "text-sm"}>{item.icon}</span>
                <span className={`text-sm transition-all duration-200 whitespace-nowrap ${isCollapsed ? "lg:w-0 lg:opacity-0 lg:hidden block" : "w-auto opacity-100 block"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200/50 bg-[#eef1f6]/95 backdrop-blur-md">
          <button
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? "lg:justify-center lg:gap-0 lg:px-2 lg:py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 w-full`}
            title={isCollapsed ? "Logout" : ""}
          >
            <FiLogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`text-sm whitespace-nowrap transition-all duration-200 ${isCollapsed ? "lg:w-0 lg:opacity-0 lg:hidden block" : "w-auto opacity-100 block"}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
      )}

      <div className={`flex-1 min-w-0 transition-all duration-300 ${isVideoRoom ? "ml-0" : (isCollapsed ? "lg:ml-16" : "lg:ml-56")} relative`}>
        {/* Soft Ambient Dashboard Background Glows */}
        <div className="fixed top-0 left-0 w-96 h-96 bg-blue-400/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-400/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        {!isVideoRoom && <DashboardNavbar user={user} role={role} setSidebarOpen={setSidebarOpen} />}

        <main className={isVideoRoom ? "p-0" : "p-4 md:p-6 lg:p-8"}>
          <Suspense fallback={<Loading />}>
            {location.pathname === "/dashboard" || location.pathname === "/dashboard/" ? (
              renderDashboard()
            ) : (
              <Outlet context={{ user, role, reloadUser }} />
            )}
          </Suspense>
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;
