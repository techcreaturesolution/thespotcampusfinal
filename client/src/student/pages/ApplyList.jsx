import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiFileText, FiExternalLink } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import PageHeader from "../../common/components/PageHeader";

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
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      <PageHeader
        icon={FiFileText}
        title="My Applications"
        subtitle="Track active placement process and exams"
        badge={`${applications.length} applications`}
      />

      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app._id} className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-shadow border-l-4 border-l-[#3730a3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
            <div className="text-left">
              <h3 className="text-sm font-extrabold text-slate-800 leading-snug">{app.job_id?.job_title || "Job Opening"}</h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{app.job_id?.job_position}</p>
              {app.job_id?.job_company_id && (
                <p className="text-[10px] font-extrabold text-slate-400 mt-1.5 uppercase tracking-wide">
                  🏢 {app.job_id.job_company_id.company_name}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3.5 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
              <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${
                app.status === "Selected" 
                  ? "bg-emerald-50 border-emerald-150 text-emerald-700" 
                  : app.status === "Rejected" 
                  ? "bg-rose-50 border-rose-150 text-rose-700" 
                  : "bg-amber-50 border-amber-150 text-amber-700"
              }`}>
                {app.status || "Applied"}
              </span>

              {app.job_id && (
                app.hasExam ? (
                  <Link 
                    to={`/dashboard/student/exam-paper/${app.job_id._id}`} 
                    className="bg-[#3730a3] hover:bg-[#2e288a] text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-xs flex items-center gap-1.5 active:scale-95 uppercase tracking-wider"
                  >
                    <FiFileText className="w-3.5 h-3.5" /> Take Exam
                  </Link>
                ) : (
                  <button 
                    disabled 
                    className="bg-slate-50 text-slate-400 font-bold py-2 px-4 rounded-xl border border-slate-200/50 text-xs flex items-center gap-1.5 cursor-not-allowed shadow-inner uppercase tracking-wider"
                  >
                    <FiFileText className="w-3.5 h-3.5" /> Exam Not Created
                  </button>
                )
              )}
            </div>
          </div>
        ))}
        {applications.length === 0 && (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed">
            <FiFileText className="w-12 h-12 text-slate-350 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-semibold">You haven't submitted any applications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyList;
