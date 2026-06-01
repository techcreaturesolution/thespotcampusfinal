import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUsers, FiCheck, FiX, FiPlay, FiVideo, FiCalendar,
  FiChevronRight, FiArrowLeft, FiClock, FiUserCheck,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-600",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const CANDIDATE_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  passed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-600",
  absent: "bg-gray-100 text-gray-500",
  on_hold: "bg-orange-100 text-orange-700",
};

const ROUND_TYPE_LABELS = {
  mcq: "MCQ Exam", technical_interview: "Technical Interview",
  hr_interview: "HR Interview", coding_test: "Coding Test",
  group_discussion: "Group Discussion", aptitude_test: "Aptitude Test",
  video_interview: "Video Interview", assignment: "Assignment", custom: "Custom",
};

const RoundManagement = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [activeRound, setActiveRound] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    fetchProgress();
  }, [jobId]);

  const fetchProgress = async () => {
    try {
      const { data } = await customFetch.get(`/rounds/job/${jobId}/progress`);
      setProgress(data.progress);
      setJobTitle(data.job_title);
    } catch (error) {
      toast.error("Failed to load round progress");
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async (roundNumber) => {
    try {
      const { data } = await customFetch.get(`/rounds/job/${jobId}/round/${roundNumber}/candidates`);
      setCandidates(data.candidates);
      setActiveRound(roundNumber);
      setSelectedCandidates([]);
    } catch (error) {
      toast.error("Failed to load candidates");
    }
  };

  const handleInitialize = async () => {
    try {
      const { data } = await customFetch.post(`/rounds/job/${jobId}/initialize`);
      toast.success(data.msg);
      fetchProgress();
      fetchCandidates(1);
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to initialize");
    }
  };

  const handleAdvance = async (action) => {
    if (selectedCandidates.length === 0) {
      toast.warn("Select candidates first");
      return;
    }
    try {
      await customFetch.post(`/rounds/job/${jobId}/advance`, {
        student_ids: selectedCandidates,
        current_round: activeRound,
        action,
      });
      toast.success(`Candidates ${action === "pass" ? "advanced" : "eliminated"}`);
      fetchProgress();
      fetchCandidates(activeRound);
    } catch (error) {
      toast.error("Failed to update candidates");
    }
  };

  const toggleCandidate = (studentId) => {
    setSelectedCandidates((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAll = () => {
    const pending = candidates.filter((c) => c.status === "pending" || c.status === "in_progress");
    setSelectedCandidates(pending.map((c) => c.student_id?._id));
  };

  const handleScheduleInterview = async (candidate) => {
    if (!scheduleDate) {
      toast.warn("Select date and time");
      return;
    }
    try {
      const roundData = progress.find((p) => p.round_number === activeRound);
      await customFetch.post("/interviews", {
        job_id: jobId,
        round_id: candidate.round_id,
        student_id: candidate.student_id._id,
        scheduled_at: scheduleDate,
        interview_mode: "video_conference",
        duration_minutes: roundData?.duration_minutes || 60,
      });
      toast.success("Interview scheduled");
      setScheduleModal(null);
      setScheduleDate("");
      fetchCandidates(activeRound);
    } catch (error) {
      toast.error("Failed to schedule interview");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Round Management</h1>
          <p className="text-gray-500">{jobTitle}</p>
        </div>
      </div>

      {/* Round Pipeline Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recruitment Pipeline</h2>
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          {progress.map((round, idx) => (
            <React.Fragment key={round.round_number}>
              <button
                onClick={() => fetchCandidates(round.round_number)}
                className={`flex-shrink-0 p-4 rounded-xl border-2 transition-all min-w-[180px] text-left ${
                  activeRound === round.round_number
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">ROUND {round.round_number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[round.status]}`}>
                    {round.status}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{round.round_name}</p>
                <p className="text-xs text-gray-500 mt-1">{ROUND_TYPE_LABELS[round.round_type]}</p>
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <span className="text-gray-500"><FiUsers className="inline w-3 h-3 mr-1" />{round.candidates.total}</span>
                  <span className="text-green-600"><FiCheck className="inline w-3 h-3 mr-1" />{round.candidates.passed}</span>
                  <span className="text-red-500"><FiX className="inline w-3 h-3 mr-1" />{round.candidates.failed}</span>
                </div>
              </button>
              {idx < progress.length - 1 && (
                <FiChevronRight className="w-5 h-5 text-gray-300 self-center flex-shrink-0 mt-6" />
              )}
            </React.Fragment>
          ))}
        </div>

        {progress.length > 0 && progress[0].candidates.total === 0 && (
          <div className="mt-4 text-center">
            <button onClick={handleInitialize} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 mx-auto">
              <FiPlay className="w-4 h-4" /> Initialize Round 1 (Start Recruitment)
            </button>
            <p className="text-xs text-gray-400 mt-2">This will add all approved applicants to Round 1</p>
          </div>
        )}
      </div>

      {/* Candidates Table */}
      {activeRound && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Round {activeRound} Candidates ({candidates.length})
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-5 rounded-lg border border-gray-300 transition-all duration-200 text-sm">Select All Pending</button>
              <button onClick={() => handleAdvance("pass")} disabled={selectedCandidates.length === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <FiCheck className="w-3.5 h-3.5" /> Pass ({selectedCandidates.length})
              </button>
              <button onClick={() => handleAdvance("fail")} disabled={selectedCandidates.length === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <FiX className="w-3.5 h-3.5" /> Fail ({selectedCandidates.length})
              </button>
            </div>
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FiUsers className="w-10 h-10 mx-auto mb-3" />
              <p>No candidates in this round yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-medium text-gray-500 w-10">
                      <input type="checkbox" onChange={(e) => e.target.checked ? selectAll() : setSelectedCandidates([])}
                        className="rounded border-gray-300" />
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Student</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Score</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Remarks</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <input type="checkbox" checked={selectedCandidates.includes(c.student_id?._id)}
                          onChange={() => toggleCandidate(c.student_id?._id)}
                          disabled={c.status === "passed" || c.status === "failed"}
                          className="rounded border-gray-300" />
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-gray-900">{c.student_id?.student_name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{c.student_id?.student_email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${CANDIDATE_COLORS[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {c.score !== null ? `${c.score}${c.max_score ? `/${c.max_score}` : ""}` : "-"}
                      </td>
                      <td className="py-3 px-3 text-gray-600 max-w-[200px] truncate">{c.remarks || "-"}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          {(c.round_type?.includes("interview") || c.round_type === "video_interview") && c.status !== "passed" && c.status !== "failed" && (
                            <button onClick={() => setScheduleModal(c)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100">
                              <FiVideo className="w-3 h-3" /> Schedule
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Interview</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scheduling video interview for <strong>{scheduleModal.student_id?.student_name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input type="datetime-local" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200" value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setScheduleModal(null); setScheduleDate(""); }} className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-5 rounded-lg border border-gray-300 transition-all duration-200">Cancel</button>
              <button onClick={() => handleScheduleInterview(scheduleModal)} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                <FiCalendar className="w-4 h-4 inline mr-1" /> Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundManagement;
