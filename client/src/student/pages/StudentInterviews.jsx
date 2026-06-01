import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiVideo, FiClock, FiCalendar, FiBriefcase, FiExternalLink } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const STATUS_STYLES = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-yellow-100 text-yellow-700",
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
    const scheduledTime = new Date(interview.scheduled_at);
    const now = new Date();
    const diffMinutes = (scheduledTime - now) / 1000 / 60;
    return diffMinutes <= 10;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Interviews</h1>
        <p className="text-gray-500 mt-1">{interviews.length} interviews scheduled</p>
      </div>

      <div className="space-y-4">
        {interviews.map((interview) => (
          <div key={interview._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FiVideo className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {interview.job_id?.job_title || "Interview"}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[interview.status]}`}>
                    {interview.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FiBriefcase className="w-3.5 h-3.5" />
                    {interview.company_id?.company_name || "Company"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-3.5 h-3.5" />
                    {new Date(interview.scheduled_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3.5 h-3.5" />
                    {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Mode: {interview.interview_mode === "video_conference" ? "Video Conference" : interview.interview_mode}
                  {interview.duration_minutes && ` | Duration: ${interview.duration_minutes} min`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isJoinable(interview) && interview.interview_mode === "video_conference" && (
                  <Link to={`/dashboard/video-interview/${interview.room_id}`}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2">
                    <FiVideo className="w-4 h-4" /> Join Interview
                  </Link>
                )}
                {!isJoinable(interview) && interview.status === "scheduled" && (
                  <span className="text-sm text-gray-400">
                    Available 10 min before scheduled time
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {interviews.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <FiVideo className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg">No interviews scheduled</p>
            <p className="text-sm mt-1">Interviews will appear here when scheduled by companies.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentInterviews;
