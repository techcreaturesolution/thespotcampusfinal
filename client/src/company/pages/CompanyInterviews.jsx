import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiVideo, FiClock, FiCalendar, FiUser, FiCheck,
  FiX, FiPlay, FiStar, FiBriefcase
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";

const STATUS_STYLES = {
  scheduled: "bg-blue-50 text-blue-700 border border-blue-150",
  in_progress: "bg-emerald-50 text-emerald-700 border border-emerald-150 animate-pulse",
  completed: "bg-slate-50 text-slate-500 border border-slate-150",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-150",
  no_show: "bg-amber-50 text-amber-700 border border-amber-150",
};

const CompanyInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data } = await customFetch.get("/interviews");
      setInterviews(data.interviews);
    } catch (error) {
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this interview?")) return;
    try {
      await customFetch.patch(`/interviews/${id}/cancel`, { reason: "Cancelled by company" });
      toast.success("Interview cancelled");
      fetchInterviews();
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) {
      toast.warn("Select date and time");
      return;
    }
    try {
      await customFetch.patch(`/interviews/${rescheduleModal._id}`, {
        scheduled_at: new Date(rescheduleDate).toISOString(),
      });
      toast.success("Interview rescheduled");
      setRescheduleModal(null);
      setRescheduleDate("");
      fetchInterviews();
    } catch {
      toast.error("Failed to reschedule");
    }
  };

  const filtered = filter === "all" ? interviews : interviews.filter((i) => i.status === filter);

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiVideo}
        title="Interviews"
        subtitle="Schedule, conduct, and review video interviews with candidates."
        badge={`${interviews.length} total`}
        action={
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            {["all", "scheduled", "in_progress", "completed", "cancelled"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${filter === f
                    ? "vibrant-btn text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200/60"
                  }`}
              >
                {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-4">
        {filtered.map((interview) => (
          <div
            key={interview._id}
            className="bg-white rounded-2xl border-l-4 border-l-[#3730a3] border-y border-r border-slate-200/80 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">
                    {interview.student_id?.student_name || "Student"}
                  </h3>
                  {(() => {
                    const isExpired = Date.now() > new Date(interview.scheduled_at).getTime() + (interview.duration_minutes || 60) * 60 * 1000;
                    const displayStatus = (isExpired && (interview.status === "scheduled" || interview.status === "in_progress")) ? "no_show" : interview.status;
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLES[displayStatus]}`}>
                        {displayStatus === "no_show" ? "TIMELINE OUT" : displayStatus.replace("_", " ").toUpperCase()}
                      </span>
                    );
                  })()}
                  {interview.rating && (
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-150 rounded-full px-2.5 py-0.5 text-xs font-extrabold">
                      <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" /> {interview.rating}/10 Rating
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-slate-600">
                    <FiCalendar className="w-3.5 h-3.5 text-[#2563eb]" />
                    {new Date(interview.scheduled_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-slate-600">
                    <FiClock className="w-3.5 h-3.5 text-purple-600" />
                    {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-[#3730a3]">
                    <FiBriefcase className="w-3.5 h-3.5 text-[#3730a3]/70" />
                    {interview.job_id?.job_title || "Unknown Job"}
                  </span>
                </div>

                {interview.recommendation && (
                  <p className="text-xs text-slate-600 font-bold bg-[#f8f9ff]/60 border border-indigo-50/80 px-2.5 py-1.5 rounded-lg w-fit mt-1.5">
                    Recommendation: <span className="text-[#3730a3] uppercase">{interview.recommendation.replace("_", " ")}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto lg:justify-end border-t border-slate-100 lg:border-t-0 pt-4 lg:pt-0">
                {(() => {
                  const isExpired = Date.now() > new Date(interview.scheduled_at).getTime() + (interview.duration_minutes || 60) * 60 * 1000;
                  if ((interview.status === "scheduled" || interview.status === "in_progress") && !isExpired) {
                    return (
                      <>
                        <Link
                          to={`/dashboard/video-interview/${interview.room_id}`}
                          className="vibrant-btn text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-indigo-500/20 text-sm flex items-center gap-1.5"
                        >
                          <FiVideo className="w-4 h-4" /> {interview.status === "in_progress" ? "Rejoin" : "Start"}
                        </Link>
                        <button
                          onClick={() => {
                            setRescheduleModal(interview);
                            if (interview.scheduled_at) {
                              const d = new Date(interview.scheduled_at);
                              const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                              setRescheduleDate(localISO);
                            }
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] border border-indigo-200 font-bold py-2.5 px-5 rounded-xl transition-all duration-200 text-sm flex items-center gap-1.5"
                        >
                          <FiCalendar className="w-4 h-4" /> Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(interview._id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-2.5 px-5 rounded-xl transition-all duration-200 text-sm flex items-center gap-1.5"
                        >
                          <FiX className="w-4 h-4" /> Cancel
                        </button>
                      </>
                    );
                  }
                  if (interview.status !== "completed") {
                    return (
                      <button
                        onClick={() => {
                          setRescheduleModal(interview);
                          if (interview.scheduled_at) {
                            const d = new Date(interview.scheduled_at);
                            const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                            setRescheduleDate(localISO);
                          }
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] border border-indigo-200 font-bold py-2.5 px-5 rounded-xl transition-all duration-200 text-sm flex items-center gap-1.5"
                      >
                        <FiCalendar className="w-4 h-4" /> Reschedule
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16 text-gray-500 text-sm">
            <FiVideo className="w-10 h-10 text-gray-300 mb-3" />
            <p>No {filter !== "all" ? filter.replace("_", " ") : ""} interviews found</p>
          </div>
        )}
      </div>

      {/* Reschedule Interview Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-205">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-3">Reschedule Interview</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Define the new scheduled slot for <strong className="text-slate-800 font-extrabold">{rescheduleModal.student_id?.student_name}</strong>. Candidates will be notified of the updated slot.
            </p>
            <div className="mb-5">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">New Slot Date & Time</label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none transition font-bold text-slate-750 text-xs"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => { setRescheduleModal(null); setRescheduleDate(""); }}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl border border-slate-200 transition text-xs shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2 px-4 rounded-xl transition shadow-md shadow-indigo-500/10 text-xs flex items-center gap-1.5"
              >
                <FiCalendar className="w-3.5 h-3.5 fill-white" /> Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyInterviews;
