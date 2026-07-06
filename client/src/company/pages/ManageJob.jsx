import React, { useEffect, useState } from "react";
import { Link, useOutletContext, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPlus, FiTrash2, FiCpu, FiFileText, FiEye, FiBriefcase,
  FiLayers, FiVideo, FiUsers, FiChevronRight, FiPlay, FiEdit,
  FiMapPin, FiCalendar, FiDollarSign, FiAward
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import CreateJobModal from "../components/CreateJobModal";
import CreateExamFromJDModal from "../components/CreateExamFromJDModal";

const ROUND_TYPE_LABELS = {
  mcq: "MCQ Exam", technical_interview: "Technical Interview",
  hr_interview: "HR Interview", coding_test: "Coding Test",
  group_discussion: "Group Discussion", aptitude_test: "Aptitude Test",
  video_interview: "Video Interview", assignment: "Assignment", custom: "Custom",
};

const ManageJob = () => {
  const { role } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [isExamFromJDModalOpen, setIsExamFromJDModalOpen] = useState(false);
  const [examJobId, setExamJobId] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (location.state?.openCreateModal) {
      setEditingJobId(null);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchJobs = async () => {
    try {
      let endpoint = "/jobs";
      if (["College", "University", "TPO", "Admin"].includes(role)) {
        endpoint = "/jobs/college";
      }
      const { data } = await customFetch.get(endpoint);
      setJobs(data.jobs || []);
      setExams(data.exam || []);

      if (role === "Company") {
        const { data: subData } = await customFetch.get("/recruitment-subscription/check");
        setHasSubscription(subData.hasSubscription);
      }
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [role]);

  const hasExam = (jobId) => exams.some((e) => e.job_id?.toString() === jobId?.toString());

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job and all associated data?")) return;
    try {
      await customFetch.delete(`/jobs/${id}`);
      toast.success("Job deleted");
      fetchJobs();
    } catch {
      toast.error("Failed to delete job");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "0" ? "1" : "0";
    const action = currentStatus === "1" ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this job opening?`)) return;
    try {
      await customFetch.patch(`/jobs/${id}`, { job_status: nextStatus });
      toast.success(`Job ${action}d successfully`);
      fetchJobs();
    } catch {
      toast.error(`Failed to ${action} job`);
    }
  };

  const panelTitles = {
    Company: { title: "Jobs & Recruitment", subtitle: "Post openings, manage rounds, and run AI proctored exams." },
    College: { title: "Placement Openings", subtitle: "Review corporate vacancies and package details for your campus." },
    University: { title: "Campus Placements", subtitle: "View recruitment drives across affiliated colleges." },
    TPO: { title: "Active Openings", subtitle: "Track vacancies and guide students through applications." },
    Admin: { title: "All Jobs", subtitle: "System-wide job listings." },
  };
  const header = panelTitles[role] || { title: "Jobs", subtitle: `${jobs.length} jobs found` };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiBriefcase}
        title={header.title}
        subtitle={header.subtitle}
        badge={`${jobs.length} jobs`}
        action={
          role === "Company" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingJobId(null);
                  setIsModalOpen(true);
                }}
                className="vibrant-btn text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 hover:opacity-95 active:scale-95 flex items-center gap-2 text-sm shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <FiPlus className="w-4 h-4" /> Create Job
              </button>
            </div>
          ) : null
        }
      />

      <div className="space-y-5">
        {jobs.map((job) => (
          <div
            key={job._id}
            className="bg-white rounded-2xl border-l-4 border-l-[#3730a3] border-y border-r border-slate-200/80 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">{job.job_title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-[#3730a3] border border-indigo-100/50">
                      {job.job_type}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/50">
                      {job.job_work_mode}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      job.job_status === "0"
                        ? "bg-rose-50 text-rose-700 border-rose-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}>
                      {job.job_status === "0" ? "Deactivated" : "Active"}
                    </span>
                    {job.has_multiple_rounds && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100/50">
                        <FiLayers className="w-3 h-3" /> {job.rounds?.length || 0} Rounds
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-bold text-slate-500">
                    <span className="text-slate-700 font-extrabold text-sm flex items-center gap-1">
                      <FiBriefcase className="w-3.5 h-3.5 text-slate-400" /> {job.job_position}
                    </span>
                    {job.job_salary && (
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <FiDollarSign className="w-3.5 h-3.5 text-slate-400" /> Salary: <span className="text-slate-800">{job.job_salary}</span>
                      </span>
                    )}
                    {job.job_exp && (
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <FiAward className="w-3.5 h-3.5 text-slate-400" /> Exp: <span className="text-slate-800">{job.job_exp}</span>
                      </span>
                    )}
                    {job.job_noofposition && (
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <FiUsers className="w-3.5 h-3.5 text-[#3730a3]" /> Openings: <span className="text-[#3730a3]">{job.job_noofposition}</span>
                      </span>
                    )}
                  </div>

                  {(job.job_location?.city || job.job_reg_end_date) && (
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-semibold">
                      {job.job_location?.city && (
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <FiMapPin className="w-3.5 h-3.5 text-rose-500" /> {job.job_location.city}{job.job_location.state && `, ${job.job_location.state}`}
                        </span>
                      )}
                      {job.job_reg_end_date && (
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <FiCalendar className="w-3.5 h-3.5 text-[#2563eb]" /> Apply by: {job.job_reg_end_date}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full xl:w-auto xl:justify-end mt-3 xl:mt-0">
                  {role === "Company" && (
                    <>
                      {!hasExam(job._id) ? (
                        <button
                          onClick={() => {
                            setExamJobId(job._id);
                            setIsExamFromJDModalOpen(true);
                          }}
                          className="vibrant-btn text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 hover:opacity-95 active:scale-95 text-sm flex items-center gap-1.5 shadow-sm shadow-indigo-500/10"
                        >
                          <FiCpu className="w-3.5 h-3.5" /> Generate Exam from JD
                        </button>
                      ) : (
                        <Link
                          to={`/dashboard/company/exam-result/${job._id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 text-sm flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
                        >
                          <FiEye className="w-3.5 h-3.5" /> View Results
                        </Link>
                      )}
                      {job.has_multiple_rounds && (
                        <Link
                          to={`/dashboard/company/round-management/${job._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200 shadow-sm shadow-purple-500/10"
                        >
                          <FiLayers className="w-3.5 h-3.5" /> Manage Rounds
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setEditingJobId(job._id);
                          setIsModalOpen(true);
                        }}
                        className="bg-[#f0f2fa] hover:bg-[#e2e6f5] text-[#3730a3] border border-indigo-150/50 font-bold py-2 px-4 rounded-xl transition-all duration-200 text-sm flex items-center gap-1.5 shadow-sm"
                      >
                        <FiEdit className="w-3.5 h-3.5 text-[#3730a3]" /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(job._id, job.job_status)}
                        className={`font-bold py-2 px-4 rounded-xl transition-all duration-200 text-sm flex items-center gap-1.5 ${
                          job.job_status === "0"
                            ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-sm"
                        }`}
                        title={job.job_status === "0" ? "Activate Job" : "Deactivate Job"}
                      >
                        <FiPlay className={`w-3.5 h-3.5 ${job.job_status === "1" ? "rotate-90 text-slate-500" : "text-emerald-500"}`} />
                        {job.job_status === "0" ? "Activate" : "Deactivate"}
                      </button>
                      <button
                        onClick={() => handleDelete(job._id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-2 px-4 rounded-xl transition-all duration-200 text-sm flex items-center gap-1.5 shadow-sm"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Skills section & Description */}
              <div className="space-y-3.5">
                {job.job_skills && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] tracking-wider font-extrabold text-slate-400 mr-1.5 uppercase">Required Skills:</span>
                    {job.job_skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill, sIdx) => (
                      <span key={sIdx} className="bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-lg text-xs font-semibold border border-slate-200/60">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                {job.job_desc && (
                  <div className="bg-[#f8f9ff]/60 p-4 rounded-xl border border-indigo-100/50 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    <span className="font-bold text-slate-800 block mb-1">Job Description</span>
                    {job.job_desc}
                  </div>
                )}
                {job.job_company_id && (
                  <p className="text-xs font-semibold text-slate-400">Posted by: {job.job_company_id.company_name}</p>
                )}
              </div>

              {/* Round Pipeline Preview */}
              {job.has_multiple_rounds && job.rounds?.length > 0 && (
                <div className="border-t border-slate-100 pt-3.5">
                  <p className="text-[10px] tracking-wider font-extrabold text-slate-400 mb-2.5 uppercase">Recruitment Pipeline</p>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {job.rounds.map((round, idx) => (
                      <React.Fragment key={round._id || idx}>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap ${
                          round.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                            : round.status === "active"
                            ? "bg-blue-50 text-blue-700 border-blue-150"
                            : "bg-slate-50 text-slate-500 border-slate-150"
                        }`}>
                          {round.interview_mode === "video_conference" && <FiVideo className="w-3 h-3" />}
                          {round.round_name || ROUND_TYPE_LABELS[round.round_type]}
                        </div>
                        {idx < job.rounds.length - 1 && (
                          <FiChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <FiBriefcase className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg">No jobs found</p>
          </div>
        )}
      </div>
      <CreateJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobId={editingJobId}
        onSuccess={fetchJobs}
      />
      <CreateExamFromJDModal
        isOpen={isExamFromJDModalOpen}
        onClose={() => setIsExamFromJDModalOpen(false)}
        jobId={examJobId}
        onSuccess={fetchJobs}
      />
    </div>
  );
};

export default ManageJob;
