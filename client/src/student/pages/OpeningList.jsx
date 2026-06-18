import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiBriefcase, FiMapPin, FiClock } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import PageHeader from "../../common/components/PageHeader";

const OpeningList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchJobs = async () => {
    try {
      const { data } = await customFetch.get(`/jobs/student?search=${search}`);
      setJobs(data.jobs || []);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [search]);

  const handleApply = async (jobId) => {
    try {
      await customFetch.post(`/application/${jobId}`);
      toast.success("Applied successfully!");
      fetchJobs();
    } catch (error) {
      if (error?.response?.data?.error === "payment_required") {
        toast.warning(error?.response?.data?.msg || "An active subscription plan is required to apply. Redirecting to plans...");
        navigate("/dashboard/student/plans");
      } else if (error?.response?.data?.error === "cv_required") {
        toast.warning(error?.response?.data?.msg || "Please generate and compile your CV first. Redirecting to CV builder...");
        navigate("/dashboard/student/ai-cv-builder");
      } else {
        toast.error(error?.response?.data?.msg || "Failed to apply");
      }
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      <PageHeader
        icon={FiBriefcase}
        title="Job Openings"
        subtitle="Explore corporate career opportunities"
        badge={`${jobs.length} openings`}
        action={
          <input 
            type="text" 
            placeholder="Search openings by title, company, skills..." 
            className="w-full sm:max-w-xs px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/30 focus:border-[#3730a3] outline-none transition-all duration-200 text-xs font-bold text-slate-700 bg-white placeholder-slate-400 shadow-xs" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {jobs.map((job) => (
          <div key={job._id} className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between border-t-4 border-t-[#3730a3] shadow-xs">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="text-left">
                  <h3 className="text-sm font-extrabold text-slate-800 leading-snug">{job.job_title}</h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide flex items-center gap-1">
                    <FiBriefcase className="w-3.5 h-3.5" />
                    {job.job_company_id?.company_name}
                  </p>
                </div>
                <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100/50 uppercase tracking-wide shrink-0">{job.job_type}</span>
              </div>

              <p className="text-xs font-bold text-slate-500 mb-2.5 text-left flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="text-slate-700 font-extrabold">{job.job_position}</span>
                {job.job_salary && <><span>•</span> <span>Salary: {job.job_salary}</span></>}
                {job.job_noofposition && <><span>•</span> <span>Positions: {job.job_noofposition}</span></>}
              </p>

              {job.job_skills && (
                <div className="flex flex-wrap gap-1 mt-1 mb-3">
                  {job.job_skills.split(",").map((skill, index) => (
                    <span key={index} className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200/30 uppercase tracking-wide">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              )}

              {job.job_desc && (
                <div className="mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-550 whitespace-pre-line leading-relaxed text-left max-h-24 overflow-y-auto">
                  <span className="font-extrabold text-slate-700 block mb-1 uppercase text-[9px] tracking-wider">Description:</span>
                  {job.job_desc}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-450 font-bold mb-4 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1"><FiMapPin className="text-slate-400" />{job.job_work_mode}</span>
                <span className="flex items-center gap-1"><FiClock className="text-slate-400" />{job.job_exp || "Fresher"}</span>
                {job.job_location?.city && (
                  <span>📍 {job.job_location.city}{job.job_location.state && `, ${job.job_location.state}`}</span>
                )}
                {job.job_reg_end_date && (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/40 ml-auto">📅 Apply by: {job.job_reg_end_date}</span>
                )}
              </div>
            </div>

            {job.isApplied ? (
              <button 
                disabled 
                className="bg-slate-100 text-slate-400 font-bold py-2.5 px-5 rounded-xl cursor-not-allowed w-full text-xs flex items-center justify-center gap-2 border border-slate-250/50 shadow-inner uppercase tracking-wider"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Applied
              </button>
            ) : (
              <button 
                onClick={() => handleApply(job._id)} 
                className="bg-[#3730a3] hover:bg-[#2e288a] text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md w-full text-xs uppercase tracking-wider active:scale-95"
              >
                Apply Now
              </button>
            )}
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="col-span-2 text-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed">
            <FiBriefcase className="w-12 h-12 text-slate-350 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-semibold">No openings available at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpeningList;
