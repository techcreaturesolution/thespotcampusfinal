import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiFileText, FiExternalLink } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const ApplyList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const { data } = await customFetch.get("/application/student");
        setApplications(data.applications || []);
      } catch { setApplications([]); }
      finally { setLoading(false); }
    };
    fetchApps();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Applications</h1>
      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app._id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{app.job_id?.job_title || "Job"}</h3>
                <p className="text-sm text-gray-500">{app.job_id?.job_position}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={app.status === "Selected" ? "badge-success" : app.status === "Rejected" ? "badge-danger" : "badge-warning"}>
                  {app.status || "Applied"}
                </span>
                {app.job_id && (
                  <Link to={`/dashboard/exam-paper/${app.job_id._id}`} className="btn-primary text-sm flex items-center gap-1">
                    <FiFileText className="w-3.5 h-3.5" /> Take Exam
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
        {applications.length === 0 && <div className="text-center py-20 text-gray-400"><FiFileText className="w-12 h-12 mx-auto mb-4" /><p>No applications yet</p></div>}
      </div>
    </div>
  );
};

export default ApplyList;
