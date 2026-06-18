import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPlus, FiTrash2, FiCpu, FiFileText, FiEye, FiBriefcase,
  FiLayers, FiVideo, FiUsers, FiChevronRight, FiPlay, FiCheck,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";

const ROUND_TYPE_LABELS = {
  mcq: "MCQ Exam", technical_interview: "Technical Interview",
  hr_interview: "HR Interview", coding_test: "Coding Test",
  group_discussion: "Group Discussion", aptitude_test: "Aptitude Test",
  video_interview: "Video Interview", assignment: "Assignment", custom: "Custom",
};

const ManageJob = () => {
  const { role } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [exams, setExams] = useState([]);
  const [collegeId, setCollegeId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      let endpoint = "/jobs";
      if (["College", "University", "TPO", "Admin"].includes(role)) {
        endpoint = "/jobs/college";
      }
      const { data } = await customFetch.get(endpoint);
      setJobs(data.jobs || []);
      setExams(data.exam || []);
      if (data.collegeId) {
        setCollegeId(data.collegeId);
      }
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveToggle = async (jobId, currentStatus) => {
    try {
      const { data } = await customFetch.patch(`/jobs/${jobId}/approve`, {
        approved: !currentStatus,
      });
      toast.success(data.msg || "Status updated successfully");
      fetchJobs();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update status");
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
              <Link
                to="/dashboard/recruitment-subscription"
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-5 rounded-lg border border-gray-300 transition-all duration-200 flex items-center gap-2 text-sm"
              >
                <FiLayers /> Subscription
              </Link>
              <Link
                to="/dashboard/create-job"
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <FiPlus /> Create Job
              </Link>
            </div>
          ) : null
        }
      />

      <div className="space-y-5">
        {jobs.map((job) => (
          <div key={job._id} className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-l-4 ${
            job.job_status === "0" ? "border-l-slate-400" : "border-l-[#3730a3]"
          }`}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{job.job_title}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100/50 uppercase tracking-wide">{job.job_type}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100/50 uppercase tracking-wide">{job.job_work_mode}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                      job.job_status === "0"
                        ? "bg-rose-50 text-rose-700 border-rose-100/50"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100/50"
                    }`}>
                      {job.job_status === "0" ? "Deactivated" : "Active"}
                    </span>
                    {job.has_multiple_rounds && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-100/50 uppercase tracking-wide">
                        <FiLayers className="w-3 h-3" /> {job.rounds?.length || 0} Rounds
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-slate-700 font-extrabold text-sm">{job.job_position}</span>
                    {job.job_salary && <><span>•</span> <span>Salary: {job.job_salary}</span></>}
                    {job.job_exp && <><span>•</span> <span>Experience: {job.job_exp}</span></>}
                    {job.job_noofposition && <><span>•</span> <span>Positions: {job.job_noofposition}</span></>}
                  </p>
                  {(job.job_location?.city || job.job_reg_end_date) && (
                    <p className="text-[11px] font-bold text-slate-400 mt-2 flex flex-wrap items-center gap-3">
                      {job.job_location?.city && (
                        <span className="flex items-center gap-1">
                          📍 {job.job_location.city}
                          {job.job_location.state && `, ${job.job_location.state}`}
                        </span>
                      )}
                      {job.job_reg_end_date && (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100/40">
                          📅 Apply by: {job.job_reg_end_date}
                        </span>
                      )}
                    </p>
                  )}
                  
                  {job.job_skills && (
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {job.job_skills.split(",").map((skill, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200/40 uppercase tracking-wide">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {job.job_desc && (
                    <div className="mt-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      <span className="font-extrabold text-slate-700 block mb-1.5 uppercase text-[10px] tracking-wider">Job Description:</span>
                      {job.job_desc}
                    </div>
                  )}
                  {job.job_company_id && (
                    <p className="text-[10px] font-extrabold text-slate-400 mt-2.5 uppercase tracking-wider flex items-center gap-1">
                      <FiBriefcase className="w-3.5 h-3.5" />
                      {job.job_company_id.company_name}
                    </p>
                  )}
                </div>
 
                <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
                  {role === "Company" && (
                    <>
                      {!hasExam(job._id) ? (
                        <Link to={`/dashboard/create-exam-jd/${job._id}`}
                          className="bg-[#3730a3] hover:bg-[#2e288a] text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-xs flex items-center gap-1.5 active:scale-95">
                          <FiCpu className="w-3.5 h-3.5" /> Generate from JD
                        </Link>
                      ) : (
                        <Link to={`/dashboard/exam-result/${job._id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-xs flex items-center gap-1.5 shadow-sm active:scale-95">
                          <FiEye className="w-3.5 h-3.5" /> View Results
                        </Link>
                      )}
                      {job.has_multiple_rounds && (
                        <Link to={`/dashboard/round-management/${job._id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm active:scale-95">
                          <FiLayers className="w-3.5 h-3.5" /> Manage Rounds
                        </Link>
                      )}
                      <button onClick={() => handleDelete(job._id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 font-bold py-2.5 px-3 rounded-xl transition-all duration-200 text-xs flex items-center gap-1 active:scale-95">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
 
                  {role === "TPO" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
                      <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> Targeted to Campus
                    </span>
                  )}
                </div>
              </div>
 
              {/* Round Pipeline Preview */}
              {job.has_multiple_rounds && job.rounds?.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-extrabold text-slate-400 mb-2.5 uppercase tracking-wider">Recruitment Pipeline</p>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                    {job.rounds.map((round, idx) => (
                      <React.Fragment key={round._id || idx}>
                        <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border whitespace-nowrap shadow-xs ${
                          round.status === "completed" ? "bg-emerald-50 border-emerald-150 text-emerald-700" :
                          round.status === "active" ? "bg-blue-50 border-blue-150 text-blue-750" :
                          "bg-slate-50 border-slate-150 text-slate-500"
                        }`}>
                          {round.interview_mode === "video_conference" && <FiVideo className="w-3.5 h-3.5" />}
                          {round.round_name || ROUND_TYPE_LABELS[round.round_type]}
                        </div>
                        {idx < job.rounds.length - 1 && (
                          <FiChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
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
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed">
            <FiBriefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-semibold">No jobs found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageJob;
