import React, { useEffect, useState } from "react";
import { Link, useOutletContext, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPlus, FiTrash2, FiCpu, FiFileText, FiEye, FiBriefcase,
  FiLayers, FiVideo, FiUsers, FiChevronRight, FiPlay, FiEdit
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import CreateJobModal from "../components/CreateJobModal";
import CreateExamModal from "../components/CreateExamModal";
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
  const [jobs, setJobs] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isExamFromJDModalOpen, setIsExamFromJDModalOpen] = useState(false);
  const [examJobId, setExamJobId] = useState(null);

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
                to="/dashboard/company/recruitment-subscription"
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-5 rounded-lg border border-gray-300 transition-all duration-200 flex items-center gap-2 text-sm"
              >
                <FiLayers /> Subscription
              </Link>
              <button
                onClick={() => {
                  setEditingJobId(null);
                  setIsModalOpen(true);
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <FiPlus /> Create Job
              </button>
            </div>
          ) : null
        }
      />

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.job_title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{job.job_type}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">{job.job_work_mode}</span>
                    {job.has_multiple_rounds && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <FiLayers className="w-3 h-3" /> {job.rounds?.length || 0} Rounds
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{job.job_position} | {job.job_salary || "Not specified"}</p>
                  <p className="text-sm text-gray-500 mt-1">Skills: {job.job_skills}</p>
                  {job.job_company_id && (
                    <p className="text-xs text-gray-400 mt-1">{job.job_company_id.company_name}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {role === "Company" && (
                    <>
                      {!hasExam(job._id) ? (
                        <>
                           <button onClick={() => {
                             setExamJobId(job._id);
                             setIsExamModalOpen(true);
                           }}
                             className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-5 rounded-lg border border-gray-300 transition-all duration-200 text-sm flex items-center gap-1">
                             <FiFileText className="w-3.5 h-3.5" /> Create Exam
                           </button>
                           <button onClick={() => {
                             setExamJobId(job._id);
                             setIsExamFromJDModalOpen(true);
                           }}
                             className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center gap-1">
                             <FiCpu className="w-3.5 h-3.5" /> Generate from JD
                           </button>
                        </>
                      ) : (
                        <Link to={`/dashboard/company/exam-result/${job._id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 text-sm flex items-center gap-1">
                          <FiEye className="w-3.5 h-3.5" /> View Results
                        </Link>
                      )}
                      {job.has_multiple_rounds && (
                        <Link to={`/dashboard/company/round-management/${job._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                          <FiLayers className="w-3.5 h-3.5" /> Manage Rounds
                        </Link>
                      )}
                      <button onClick={() => {
                        setEditingJobId(job._id);
                        setIsModalOpen(true);
                      }}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 text-sm flex items-center gap-1">
                        <FiEdit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(job._id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 text-sm flex items-center gap-1">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Round Pipeline Preview */}
              {job.has_multiple_rounds && job.rounds?.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">RECRUITMENT PIPELINE</p>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {job.rounds.map((round, idx) => (
                      <React.Fragment key={round._id || idx}>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                          round.status === "completed" ? "bg-green-100 text-green-700" :
                          round.status === "active" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {round.interview_mode === "video_conference" && <FiVideo className="w-3 h-3" />}
                          {round.round_name || ROUND_TYPE_LABELS[round.round_type]}
                        </div>
                        {idx < job.rounds.length - 1 && (
                          <FiChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
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
      <CreateExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        jobId={examJobId}
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
