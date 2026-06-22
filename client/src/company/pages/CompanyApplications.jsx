import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiBriefcase,
  FiBookOpen,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiPhone,
  FiMail,
  FiEye,
  FiFileText,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";

const STATUS_BADGES = {
  pending: "bg-amber-50 text-amber-700 border-amber-150",
  selected: "bg-emerald-50 text-emerald-700 border-emerald-150",
  rejected: "bg-rose-50 text-rose-700 border-rose-150",
  on_hold: "bg-orange-50 text-orange-700 border-orange-150",
  withdrawn: "bg-slate-50 text-slate-500 border-slate-150",
};

const CompanyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedAppId, setSelectedAppId] = useState(null);
  const [cvHtml, setCvHtml] = useState("");
  const [cvCss, setCvCss] = useState("");
  const [loadingCv, setLoadingCv] = useState(false);
  const [showCvModal, setShowCvModal] = useState(false);

  const handleViewCv = async (appId) => {
    setSelectedAppId(appId);
    setLoadingCv(true);
    setShowCvModal(true);
    try {
      const { data } = await customFetch.get(`/application/${appId}/resume`);
      setCvHtml(data.compiledHtml || "");
      setCvCss(data.compiledCss || "");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load candidate CV");
      setShowCvModal(false);
    } finally {
      setLoadingCv(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await customFetch.get("/application/company");
      setApplications(data.applications || []);
    } catch (error) {
      toast.error("Failed to load student applications");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarBg = (name) => {
    const colors = [
      "from-indigo-50 to-indigo-100 text-[#3730a3] border-indigo-200/50",
      "from-blue-50 to-blue-100 text-blue-700 border-blue-200/50",
      "from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200/50",
      "from-purple-50 to-purple-100 text-purple-700 border-purple-200/50",
      "from-rose-50 to-rose-100 text-rose-700 border-rose-200/50",
      "from-amber-50 to-amber-100 text-amber-700 border-amber-200/50",
    ];
    if (!name) return colors[0];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Filter and search logic
  const filteredApplications = applications.filter((app) => {
    const student = app.student_id || {};
    const job = app.job_id || {};
    const collegeName = student.college_id?.college_name || "";
    const universityName = student.university_id?.university_name || "";
    const name = student.student_name || "";
    const email = student.student_email || "";
    const jobTitle = job.job_title || "";
    const jobPos = job.job_position || "";

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobPos.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      universityName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Normalize final_result state
    const result = app.final_result || "pending";

    if (statusFilter === "pending") return result === "pending";
    if (statusFilter === "selected") return result === "selected";
    if (statusFilter === "rejected") return result === "rejected";

    return true;
  });

  // Calculate statistics
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => (a.final_result || "pending") === "pending").length,
    selected: applications.filter((a) => a.final_result === "selected").length,
    rejected: applications.filter((a) => a.final_result === "rejected").length,
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FiUsers}
        title="Student Applications"
        subtitle="Review and track all students who have applied for your job openings."
        badge={`${filteredApplications.length} applied`}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#3730a3]">
            <FiUsers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Applied</p>
            <h4 className="text-xl font-extrabold text-slate-800">{stats.total}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <FiClock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending Review</p>
            <h4 className="text-xl font-extrabold text-slate-800">{stats.pending}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Selected</p>
            <h4 className="text-xl font-extrabold text-slate-800">{stats.selected}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <FiXCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rejected</p>
            <h4 className="text-xl font-extrabold text-slate-800">{stats.rejected}</h4>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {/* Search & Filter Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student, job, college, university..."
              className="w-full pl-10 pr-4 py-2 border border-slate-250 rounded-xl focus:ring-2 focus:ring-[#3730a3]/30 focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-extrabold text-slate-400 mr-1.5 flex items-center gap-1 shrink-0">
              <FiFilter className="w-3.5 h-3.5" /> FILTERS:
            </span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${statusFilter === "all" ? "bg-[#3730a3] text-white" : "hover:bg-slate-100 text-slate-650"
                }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${statusFilter === "pending" ? "bg-amber-600 text-white" : "hover:bg-slate-100 text-slate-650"
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "pending" ? "bg-white" : "bg-amber-500"}`} /> Pending
            </button>
            <button
              onClick={() => setStatusFilter("selected")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${statusFilter === "selected" ? "bg-emerald-600 text-white" : "hover:bg-slate-100 text-slate-650"
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "selected" ? "bg-white" : "bg-emerald-500"}`} /> Selected
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${statusFilter === "rejected" ? "bg-rose-600 text-white" : "hover:bg-slate-100 text-slate-650"
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "rejected" ? "bg-white" : "bg-rose-500"}`} /> Rejected
            </button>
          </div>
        </div>

        {/* Applications Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fd] text-[#3730a3] border-b border-slate-200/80">
                <th className="text-left py-3.5 px-5 font-extrabold uppercase tracking-wider text-xs">Student</th>
                <th className="text-left py-3.5 px-4 font-extrabold uppercase tracking-wider text-xs">Job Position</th>
                <th className="text-left py-3.5 px-4 font-extrabold uppercase tracking-wider text-xs">College & University</th>
                <th className="text-left py-3.5 px-4 font-extrabold uppercase tracking-wider text-xs">Applied Date</th>
                <th className="text-center py-3.5 px-4 font-extrabold uppercase tracking-wider text-xs">CV</th>
                <th className="text-right py-3.5 px-5 font-extrabold uppercase tracking-wider text-xs">Selection Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.map((app) => {
                const student = app.student_id || {};
                const job = app.job_id || {};
                const college = student.college_id?.college_name || "-";
                const university = student.university_id?.university_name || "-";
                const status = app.final_result || "pending";

                return (
                  <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Student Identity */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs border bg-gradient-to-br ${getAvatarBg(
                            student.student_name
                          )}`}
                        >
                          {getInitials(student.student_name)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 leading-snug">
                            {student.student_name || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Job Details */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 border border-indigo-100/50 rounded-lg text-[#3730a3]">
                          <FiBriefcase className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 leading-snug">{job.job_title || "-"}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{job.job_position || "-"}</p>
                        </div>
                      </div>
                    </td>

                    {/* College & University */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 border border-blue-100/50 rounded-lg text-blue-600">
                          <FiBookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div className="max-w-[280px]">
                          <p className="font-extrabold text-slate-800 leading-snug truncate" title={college}>
                            {college}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate" title={university}>
                            {university}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Applied Date */}
                    <td className="py-4 px-4 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}
                      </div>
                    </td>

                    {/* CV Column */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleViewCv(app._id)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] border border-indigo-200/50 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 shadow-xs active:scale-95 flex items-center gap-1 mx-auto"
                      >
                        <FiEye className="w-3.5 h-3.5" /> View CV
                      </button>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${STATUS_BADGES[status]}`}>
                        {status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-20 text-slate-400">
                    <FiUsers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-extrabold text-slate-750 text-base">No applications found</p>
                    <p className="text-xs text-slate-450 mt-1">
                      No student applications match the selected filters or search queries.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CV Preview Modal */}
      {showCvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Candidate CV Preview
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Contact details are hidden for privacy</p>
              </div>
              <button
                onClick={() => {
                  setShowCvModal(false);
                  setCvHtml("");
                  setCvCss("");
                }}
                className="text-slate-550 hover:text-slate-850 transition text-xs font-black bg-slate-200/50 hover:bg-slate-200 px-3 py-1.5 rounded-xl uppercase tracking-wider"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 bg-slate-100 overflow-hidden relative p-4 flex justify-center">
              {loadingCv ? (
                <div className="flex items-center justify-center h-full w-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3730a3]" />
                </div>
              ) : cvHtml ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-250/50 overflow-hidden relative w-full h-full max-w-[850px]">
                  <iframe
                    srcDoc={cvHtml}
                    title="Compiled Candidate Resume"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 h-full w-full">
                  <FiFileText className="w-12 h-12 mb-2 text-slate-350" />
                  <p className="font-extrabold text-sm text-slate-750">No resume available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyApplications;
