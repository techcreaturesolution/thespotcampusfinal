import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiVideo, FiClock, FiCalendar, FiBriefcase, FiExternalLink, FiInfo } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import PageHeader from "../../common/components/PageHeader";

const STATUS_STYLES = {
  scheduled: "bg-blue-50 border-blue-150 text-blue-750",
  in_progress: "bg-emerald-50 border-emerald-150 text-emerald-700",
  completed: "bg-slate-50 border-slate-200 text-slate-550",
  cancelled: "bg-rose-50 border-rose-150 text-rose-700",
  no_show: "bg-amber-50 border-amber-150 text-amber-700",
};

const StudentInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data } = await customFetch.get("/interviews/student");
      setInterviews(data.interviews);
    } catch (error) {
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const isJoinable = (interview) => {
    if (interview.status !== "scheduled" && interview.status !== "in_progress") return false;
    const scheduledTime = new Date(interview.scheduled_at).getTime();
    const durationMs = (interview.duration_minutes || 60) * 60 * 1000;
    const expiredTime = scheduledTime + durationMs;
    const now = Date.now();

    const diffMinutes = (scheduledTime - now) / 1000 / 60;
    return diffMinutes <= 10 && now < expiredTime;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      <PageHeader
        icon={FiVideo}
        title="My Interviews"
        subtitle="Join scheduled video conferences and evaluations"
        badge={`${interviews.length} interviews`}
      />

      <div className="space-y-4">
        {interviews.map((interview) => (
          <div key={interview._id} className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-shadow border-l-4 border-l-[#3730a3] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
            <div className="flex-1 text-left">
              <div className="flex flex-wrap items-center gap-3 mb-2.5">
                <FiVideo className="w-4 h-4 text-[#3730a3]" />
                <h3 className="text-sm font-extrabold text-slate-800 leading-snug">
                  {interview.job_id?.job_title || "Selection Interview"}
                </h3>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border uppercase tracking-wider ${
                  (() => {
                    const isExpired = Date.now() > new Date(interview.scheduled_at).getTime() + (interview.duration_minutes || 60) * 60 * 1000;
                    const displayStatus = (isExpired && (interview.status === "scheduled" || interview.status === "in_progress")) ? "no_show" : interview.status;
                    return STATUS_STYLES[displayStatus];
                  })()
                }`}>
                  {(() => {
                    const isExpired = Date.now() > new Date(interview.scheduled_at).getTime() + (interview.duration_minutes || 60) * 60 * 1000;
                    const displayStatus = (isExpired && (interview.status === "scheduled" || interview.status === "in_progress")) ? "no_show" : interview.status;
                    return displayStatus === "no_show" ? "TIMELINE OUT" : displayStatus.replace("_", " ");
                  })()}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-450 font-bold">
                <span className="flex items-center gap-1.5">
                  <FiBriefcase className="w-3.5 h-3.5 text-slate-400" />
                  {interview.company_id?.company_name || "Unknown Company"}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(interview.scheduled_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiClock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-450 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100/60 inline-block">
                Mode: {interview.interview_mode === "video_conference" ? "Video Conference (Online)" : interview.interview_mode}
                {interview.duration_minutes && ` | Duration: ${interview.duration_minutes} mins`}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 shrink-0 w-full lg:w-auto border-t border-slate-100 lg:border-t-0 pt-4 lg:pt-0">
              {isJoinable(interview) && interview.interview_mode === "video_conference" && (
                <Link to={`/dashboard/video-interview/${interview.room_id}`}
                  className="bg-[#3730a3] hover:bg-[#2e288a] text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider active:scale-95">
                  <FiVideo className="w-4 h-4 shrink-0" /> Join Interview
                </Link>
              )}
              {(() => {
                const isExpired = Date.now() > new Date(interview.scheduled_at).getTime() + (interview.duration_minutes || 60) * 60 * 1000;
                if (!isJoinable(interview) && interview.status === "scheduled" && !isExpired) {
                  return (
                    <span className="text-[10px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200/50 px-3 py-1.5 rounded-xl shadow-xs uppercase tracking-wider flex items-center gap-1">
                      <FiInfo className="w-3.5 h-3.5 text-slate-400" />
                      Starts 10 min prior
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        ))}

        {interviews.length === 0 && (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed">
            <FiVideo className="w-12 h-12 text-slate-350 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-semibold">No interviews scheduled yet</p>
            <p className="text-slate-400 text-xs mt-1.5">Scheduled interview rounds will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentInterviews;
