import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPlus, FiTrash2, FiCpu, FiFileText, FiEye, FiBriefcase,
  FiLayers, FiVideo, FiUsers, FiChevronRight, FiPlay, FiMapPin, FiCalendar, FiDollarSign
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

  const panelTitles = {
    Company: { title: "Jobs & Recruitment", subtitle: "Post openings, manage rounds, and run AI proctored exams." },
    College: { title: "Placement Openings", subtitle: "Review corporate vacancies and package details for affiliated campuses." },
    University: { title: "Campus Placements", subtitle: "View and coordinate active recruitment drives across your affiliated college network." },
    TPO: { title: "Active Openings", subtitle: "Track vacancies and guide students through corporate placement drives." },
    Admin: { title: "All Jobs", subtitle: "System-wide corporate job openings." },
  };
  const header = panelTitles[role] || { title: "Jobs", subtitle: `${jobs.length} jobs found` };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      <PageHeader
        icon={FiBriefcase}
        title={header.title}
        subtitle={header.subtitle}
        badge={`${jobs.length} jobs`}
        action={
          role === "Company" ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard/company/recruitment-subscription"
                className="bg-white hover:bg-slate-50 text-slate-750 font-bold py-2 px-4 rounded-xl border border-slate-200 transition flex items-center gap-2 text-xs shadow-sm"
              >
                <FiLayers className="w-4 h-4" /> Subscription
              </Link>
              <Link
                to="/dashboard/create-job"
                className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2.5 px-5 rounded-xl transition shadow-md shadow-indigo-500/10 flex items-center gap-2 text-xs"
              >
                <FiPlus className="w-4 h-4" /> Create Job
              </Link>
            </div>
          ) : null
        }
      />

      <div className="space-y-6">
        {jobs.map((job) => {
          const jobExamsExist = hasExam(job._id);
          return (
            <div
              key={job._id}
              className="bg-white rounded-2xl border-l-4 border-l-[#3730a3] border-y border-r border-slate-200/80 p-6 hover:shadow-md transition-all duration-350 hover:-translate-y-0.5 shadow-sm"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  <div className="flex-1 space-y-3">
                    {/* Header line tags */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-lg font-black text-slate-800 tracking-tight leading-snug">{job.job_title}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#3730a3] border border-indigo-150">{job.job_type}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-150">{job.job_work_mode}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        job.job_status === "0"
                          ? "bg-rose-50 text-rose-700 border-rose-150"
                          : "bg-emerald-50 text-emerald-700 border-emerald-150"
                      }`}>
                        {job.job_status === "0" ? "Inactive" : "Active"}
                      </span>
                      {job.has_multiple_rounds && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-150">
                          <FiLayers className="w-3.5 h-3.5 text-purple-650" /> {job.rounds?.length || 0} Rounds
                        </span>
                      )}
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500">
                      <p className="text-slate-800 font-extrabold">{job.job_position}</p>
                      {job.job_salary && (
                        <span className="flex items-center gap-1"><FiDollarSign className="w-3.5 h-3.5 text-slate-400" />Salary: {job.job_salary}</span>
                      )}
                      {job.job_exp && (
                        <span className="flex items-center gap-1"><FiCpu className="w-3.5 h-3.5 text-slate-400" />Experience: {job.job_exp}</span>
                      )}
                      {job.job_noofposition && (
                        <span className="flex items-center gap-1"><FiUsers className="w-3.5 h-3.5 text-slate-400" />Openings: {job.job_noofposition}</span>
                      )}
                    </div>

                    {/* Location and deadline */}
                    {(job.job_location?.city || job.job_reg_end_date) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-450 uppercase tracking-wide">
                        {job.job_location?.city && (
                          <span className="flex items-center gap-1">
                            <FiMapPin className="w-3.5 h-3.5 text-slate-400" /> {job.job_location.city}
                            {job.job_location.state && `, ${job.job_location.state}`}
                          </span>
                        )}
                        {job.job_reg_end_date && (
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5 text-slate-400" /> Deadline: {job.job_reg_end_date}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Skills pills */}
                    {job.job_skills && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Skills:</span>
                        {job.job_skills.split(",").map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg text-xxs font-bold bg-slate-50 text-slate-650 border border-slate-200">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Collapsible description */}
                    {job.job_desc && (
                      <div className="mt-4 bg-slate-50/50 p-4 rounded-xl border border-slate-150 text-xs text-slate-650 whitespace-pre-line leading-relaxed shadow-inner">
                        <span className="font-extrabold text-slate-800 block mb-1.5">Job Overview & Requirements:</span>
                        {job.job_desc}
                      </div>
                    )}

                    {job.job_company_id && (
                      <div className="pt-2 flex items-center gap-1.5 text-xxs font-extrabold tracking-wider text-indigo-750 uppercase">
                        <FiBriefcase className="w-3.5 h-3.5 text-indigo-500" /> Posted by: {job.job_company_id.company_name}
                      </div>
                    )}
                  </div>

                  {/* Actions buttons panel */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0 self-end lg:self-start">
                    {role === "Company" ? (
                      <>
                        {!jobExamsExist ? (
                          <Link to={`/dashboard/company/create-exam-jd/${job._id}`}
                            className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-md shadow-indigo-500/10 text-xs flex items-center gap-1.5">
                            <FiCpu className="w-3.5 h-3.5 fill-white/10" /> Generate from JD
                          </Link>
                        ) : (
                          <Link to={`/dashboard/company/exam-result/${job._id}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center gap-1.5 shadow-sm">
                            <FiEye className="w-3.5 h-3.5" /> View Results
                          </Link>
                        )}
                        {job.has_multiple_rounds && (
                          <Link to={`/dashboard/company/round-management/${job._id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition shadow-sm">
                            <FiLayers className="w-3.5 h-3.5" /> Manage Rounds
                          </Link>
                        )}
                        <button onClick={() => handleDelete(job._id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-3.5 rounded-xl border border-rose-250 transition text-xs flex items-center gap-1.5 shadow-sm">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      /* Actions for university, college, TPO, admin */
                      <>
                        {jobExamsExist && (
                          <Link to={`/dashboard/company/exam-result/${job._id}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl transition text-xs flex items-center gap-1.5 shadow-sm">
                            <FiEye className="w-3.5 h-3.5" /> View Results
                          </Link>
                        )}
                        {job.has_multiple_rounds && (
                          <Link to={`/dashboard/company/round-management/${job._id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#3730a3] text-white hover:bg-indigo-750 transition shadow-sm">
                            <FiLayers className="w-3.5 h-3.5" /> View Round Pipeline
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Round Pipeline Preview timeline */}
                {job.has_multiple_rounds && job.rounds?.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">RECRUITMENT PIPELINE</p>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                      {job.rounds.map((round, idx) => (
                        <React.Fragment key={round._id || idx}>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xxs font-bold border whitespace-nowrap ${
                            round.status === "completed" ? "bg-green-50 text-green-700 border-green-150" :
                            round.status === "active" ? "bg-indigo-50 text-[#3730a3] border-indigo-150 animate-pulse" :
                            "bg-slate-50 text-slate-500 border-slate-200/80"
                          }`}>
                            {round.interview_mode === "video_conference" && <FiVideo className="w-3 h-3 text-slate-400" />}
                            {round.round_name || ROUND_TYPE_LABELS[round.round_type]}
                          </div>
                          {idx < job.rounds.length - 1 && (
                            <FiChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {jobs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
            <FiBriefcase className="w-12 h-12 text-slate-350 mb-3" />
            <p className="font-extrabold text-slate-750 text-base">No placement openings found</p>
            <p className="text-xs text-slate-450 mt-1">There are no active openings posted by corporate partners yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageJob;
