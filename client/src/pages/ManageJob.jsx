import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiEdit, FiCpu, FiFileText, FiEye, FiUsers } from "react-icons/fi";
import customFetch from "../utils/customFetch";

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

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs & Exams</h1>
          <p className="text-gray-500 mt-1">{jobs.length} jobs found</p>
        </div>
        {role === "Company" && (
          <Link to="/dashboard/create-job" className="btn-primary flex items-center gap-2">
            <FiPlus /> Create Job
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job._id} className="card hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{job.job_title}</h3>
                  <span className="badge-info">{job.job_type}</span>
                  <span className="badge-success">{job.job_work_mode}</span>
                </div>
                <p className="text-sm text-gray-600">{job.job_position} | {job.job_salary || "Not specified"}</p>
                <p className="text-sm text-gray-500 mt-1">Skills: {job.job_skills}</p>
                {job.job_company_id && (
                  <p className="text-xs text-gray-400 mt-1">
                    {job.job_company_id.company_name}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {role === "Company" && (
                  <>
                    {!hasExam(job._id) ? (
                      <>
                        <Link
                          to={`/dashboard/create-exam/${job._id}`}
                          className="btn-secondary text-sm flex items-center gap-1"
                        >
                          <FiFileText className="w-3.5 h-3.5" /> Create Exam
                        </Link>
                        <Link
                          to={`/dashboard/create-exam-jd/${job._id}`}
                          className="btn-primary text-sm flex items-center gap-1"
                        >
                          <FiCpu className="w-3.5 h-3.5" /> Generate from JD
                        </Link>
                      </>
                    ) : (
                      <Link
                        to={`/dashboard/exam-result/${job._id}`}
                        className="btn-success text-sm flex items-center gap-1"
                      >
                        <FiEye className="w-3.5 h-3.5" /> View Results
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(job._id)}
                      className="btn-danger text-sm flex items-center gap-1"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
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
    </div>
  );
};

export default ManageJob;
