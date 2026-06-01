import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiBriefcase, FiMapPin, FiClock } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const OpeningList = () => {
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
      toast.error(error?.response?.data?.msg || "Failed to apply");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Openings</h1>
        <input type="text" placeholder="Search jobs..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <div key={job._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{job.job_title}</h3>
                <p className="text-sm text-gray-600">{job.job_company_id?.company_name}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{job.job_type}</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{job.job_position}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
              <span className="flex items-center gap-1"><FiMapPin />{job.job_work_mode}</span>
              <span className="flex items-center gap-1"><FiClock />{job.job_exp || "Fresher"}</span>
            </div>
            <button onClick={() => handleApply(job._id)} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md w-full text-sm">Apply Now</button>
          </div>
        ))}
        {jobs.length === 0 && <div className="col-span-2 text-center py-20 text-gray-400"><FiBriefcase className="w-12 h-12 mx-auto mb-4" /><p>No openings available</p></div>}
      </div>
    </div>
  );
};

export default OpeningList;
