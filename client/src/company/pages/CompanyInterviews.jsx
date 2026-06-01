import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiVideo, FiClock, FiCalendar, FiUser, FiCheck,
  FiX, FiPlay, FiStar,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";

const STATUS_STYLES = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-yellow-100 text-yellow-700",
};

const CompanyInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

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
          <div className="flex flex-wrap items-center gap-2">
            {["all", "scheduled", "in_progress", "completed", "cancelled"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-3">
        {filtered.map((interview) => (
          <div key={interview._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {interview.student_id?.student_name || "Student"}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[interview.status]}`}>
                    {interview.status.replace("_", " ")}
                  </span>
                  {interview.rating && (
                    <span className="flex items-center gap-1 text-yellow-600 text-sm">
                      <FiStar className="w-3.5 h-3.5" /> {interview.rating}/10
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-3.5 h-3.5" />
                    {new Date(interview.scheduled_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3.5 h-3.5" />
                    {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span>{interview.job_id?.job_title}</span>
                </div>
                {interview.recommendation && (
                  <p className="text-sm mt-1">
                    Recommendation: <span className="font-medium">{interview.recommendation.replace("_", " ")}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(interview.status === "scheduled" || interview.status === "in_progress") && (
                  <>
                    <Link to={`/dashboard/video-interview/${interview.room_id}`}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center gap-1">
                      <FiVideo className="w-3.5 h-3.5" /> {interview.status === "in_progress" ? "Rejoin" : "Start"}
                    </Link>
                    <button onClick={() => handleCancel(interview._id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 text-sm flex items-center gap-1">
                      <FiX className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                )}
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
    </div>
  );
};

export default CompanyInterviews;
