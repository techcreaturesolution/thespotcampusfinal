import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUsers, FiCheck, FiX, FiPlay, FiVideo, FiCalendar,
  FiChevronRight, FiArrowLeft, FiClock, FiUserCheck,
  FiFileText, FiCpu, FiAward, FiEdit, FiSliders, FiHelpCircle,
  FiSearch, FiLayers, FiGrid, FiList, FiFilter, FiCheckCircle
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const STATUS_COLORS = {
  pending: "bg-slate-50 text-slate-500 border-slate-150",
  active: "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-150",
  cancelled: "bg-rose-50 text-rose-700 border-rose-150",
};

const CANDIDATE_COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-150",
  in_progress: "bg-blue-50 text-blue-700 border-blue-150",
  completed: "bg-purple-50 text-purple-700 border-purple-150",
  passed: "bg-emerald-50 text-emerald-700 border-emerald-150",
  failed: "bg-rose-50 text-rose-700 border-rose-150",
  absent: "bg-slate-50 text-slate-500 border-slate-150",
  on_hold: "bg-orange-50 text-orange-700 border-orange-150",
};

const ROUND_TYPE_LABELS = {
  mcq: "MCQ Exam", technical_interview: "Technical Interview",
  hr_interview: "HR Interview", coding_test: "Coding Test",
  group_discussion: "Group Discussion", aptitude_test: "Aptitude Test",
  video_interview: "Video Interview", assignment: "Assignment", custom: "Custom",
};

const ROUND_TYPE_ICONS = {
  mcq: FiFileText,
  technical_interview: FiVideo,
  hr_interview: FiUsers,
  coding_test: FiCpu,
  group_discussion: FiUsers,
  aptitude_test: FiFileText,
  video_interview: FiVideo,
  assignment: FiEdit,
  custom: FiSliders,
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
  const [uninitializedCount, setUninitializedCount] = useState(0);
  const [evaluationModal, setEvaluationModal] = useState(null);
  const [evaluationRating, setEvaluationRating] = useState(10);
  const [evaluationNotes, setEvaluationNotes] = useState("");

  // Custom filter and view states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, passed, failed
  const [layoutMode, setLayoutMode] = useState("list"); // list, grid

  useEffect(() => {
    fetchProgress();
  }, [jobId]);

  const fetchProgress = async () => {
    try {
      const { data } = await customFetch.get(`/rounds/job/${jobId}/progress`);
      setProgress(data.progress || []);
      setJobTitle(data.job_title);
      setUninitializedCount(data.uninitialized_count || 0);
      // Auto-select the first or active round on initial load
      if (data.progress && data.progress.length > 0 && !activeRound) {
        const active = data.progress.find((r) => r.status === "active") || data.progress[0];
        fetchCandidates(active.round_number);
      }
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
    const pending = filteredCandidates.filter((c) => c.status === "pending" || c.status === "in_progress" || c.status === "completed");
    setSelectedCandidates(pending.map((c) => c.student_id?._id || c.student_id));
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
        student_id: candidate.student_id?._id || candidate.student_id,
        scheduled_at: new Date(scheduleDate).toISOString(),
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

  const handleSaveEvaluation = async () => {
    if (!evaluationModal) return;
    try {
      await customFetch.patch(`/rounds/candidate/${evaluationModal._id}`, {
        score: evaluationRating,
        max_score: 10,
        remarks: evaluationNotes,
      });
      toast.success("Evaluation saved successfully!");
      setEvaluationModal(null);
      setEvaluationRating(10);
      setEvaluationNotes("");
      fetchCandidates(activeRound);
    } catch (error) {
      toast.error("Failed to save evaluation");
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvatarBg = (name) => {
    const colors = [
      "from-indigo-50 to-indigo-100 text-[#3730a3] border-indigo-200/50",
      "from-blue-50 to-blue-100 text-blue-700 border-blue-200/50",
      "from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200/50",
      "from-purple-50 to-purple-100 text-purple-700 border-purple-200/50",
      "from-rose-50 to-rose-100 text-rose-700 border-rose-200/50",
      "from-amber-50 to-amber-100 text-amber-700 border-amber-200/50",
    ];
    if (!name) return colors[0];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Client side filtering
  const filteredCandidates = candidates.filter((c) => {
    const name = (c.student_id?.student_name || "").toLowerCase();
    const email = (c.student_id?.student_email || "").toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "pending") {
      return c.status === "pending" || c.status === "in_progress" || c.status === "completed";
    }
    if (statusFilter === "passed") {
      return c.status === "passed";
    }
    if (statusFilter === "failed") {
      return c.status === "failed";
    }
    return true;
  });

  const allVisiblePendingSelected = () => {
    const visiblePending = filteredCandidates.filter((c) => c.status === "pending" || c.status === "in_progress" || c.status === "completed");
    if (visiblePending.length === 0) return false;
    return visiblePending.every(c => selectedCandidates.includes(c.student_id?._id || c.student_id));
  };

  const handleHeaderCheckboxChange = (e) => {
    if (e.target.checked) {
      selectAll();
    } else {
      setSelectedCandidates([]);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3730a3]" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      {/* Header section */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-200 border border-slate-200 bg-white shadow-sm"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[10px] font-extrabold text-[#3730a3] uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-150">Recruitment Operations</span>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">{jobTitle}</h1>
        </div>
      </div>

      {/* Round Pipeline Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Recruitment Pipeline</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Click on any round to review and manage candidates in that step.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-thin">
          {progress.map((round, idx) => {
            const IconComponent = ROUND_TYPE_ICONS[round.round_type] || FiHelpCircle;
            const isActive = activeRound === round.round_number;
            const isCompleted = round.status === "completed";

            return (
              <React.Fragment key={round.round_number}>
                <button
                  onClick={() => fetchCandidates(round.round_number)}
                  className={`flex-shrink-0 p-4 rounded-2xl border-2 transition-all duration-300 min-w-[215px] text-left relative flex flex-col gap-3 group ${isActive
                      ? "border-[#3730a3] bg-indigo-50/20 shadow-md ring-1 ring-[#3730a3]/40"
                      : isCompleted
                        ? "border-emerald-200/80 bg-emerald-50/10 hover:border-emerald-300"
                        : "border-slate-200 hover:border-slate-350 bg-white hover:shadow-sm hover:scale-[1.01]"
                    }`}
                >
                  {/* Glowing dot for active */}
                  {isActive && (
                    <div className="absolute top-4 right-4 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3730a3]"></span>
                    </div>
                  )}

                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ROUND {round.round_number}</span>
                    {!isActive && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${STATUS_COLORS[round.status]}`}>
                        {round.status.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 border ${isActive
                        ? "bg-[#3730a3] text-white border-[#3730a3] shadow-sm shadow-indigo-500/20"
                        : "bg-indigo-50/60 text-[#3730a3] border-indigo-100 group-hover:bg-[#3730a3] group-hover:text-white group-hover:border-[#3730a3]"
                      }`}>
                      <IconComponent className="w-4.5 h-4.5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug truncate">{round.round_name}</p>
                      <p className="text-[10px] font-bold text-slate-450 mt-0.5">{ROUND_TYPE_LABELS[round.round_type]}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs font-bold border-t border-slate-100/80 pt-2.5 w-full">
                    <span className="text-slate-500 flex items-center gap-1.5" title="Total in Round"><FiUsers className="w-3.5 h-3.5 text-slate-400" />{round.candidates.total}</span>
                    <span className="text-emerald-600 flex items-center gap-1.5" title="Passed Round"><FiCheck className="w-3.5 h-3.5 text-emerald-500" />{round.candidates.passed}</span>
                    <span className="text-rose-600 flex items-center gap-1.5" title="Failed Round"><FiX className="w-3.5 h-3.5 text-rose-500" />{round.candidates.failed}</span>
                  </div>
                </button>
                {idx < progress.length - 1 && (
                  <div className="flex-shrink-0 flex items-center justify-center self-center w-6 text-slate-350">
                    <FiChevronRight className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {progress.length === 0 && (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center">
            <FiLayers className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-extrabold text-slate-700">No recruitment rounds configured</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">You can set up multiple selection rounds by editing the job opening.</p>
            <Link
              to="/dashboard/company/manage-job"
              className="bg-white hover:bg-slate-50 text-[#3730a3] border border-slate-200 font-bold py-2.5 px-5 rounded-xl text-sm transition shadow-sm"
            >
              Go to Jobs
            </Link>
          </div>
        )}

        {progress.length > 0 && progress[0].candidates.total === 0 && (
          <div className="mt-4 text-center border-t border-slate-100 pt-5">
            <button
              onClick={handleInitialize}
              className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto shadow-md shadow-indigo-500/10 text-sm hover:scale-[1.01]"
            >
              <FiPlay className="w-4 h-4 fill-white" /> Initialize Round 1 (Start Recruitment)
            </button>
            <p className="text-[10px] font-semibold text-slate-455 mt-2">This action automatically assigns all approved candidates to Round 1</p>
          </div>
        )}

        {progress.length > 0 && progress[0].candidates.total > 0 && uninitializedCount > 0 && (
          <div className="mt-4 text-center border-t border-slate-100 pt-5 animate-in fade-in duration-300">
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="text-left">
                <p className="text-xs font-black text-amber-800">New applications found!</p>
                <p className="text-[10px] font-bold text-amber-600/80 mt-0.5">
                  {uninitializedCount} candidate(s) applied after recruitment started.
                </p>
              </div>
              <button
                onClick={handleInitialize}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl transition text-xs flex items-center gap-1.5 shrink-0 active:scale-97 shadow-md shadow-amber-500/10 hover:scale-[1.01]"
              >
                <FiPlay className="w-3.5 h-3.5 fill-white" /> Sync Candidates
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidates Section */}
      {activeRound && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          {/* Section Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Candidates list <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-bold border border-slate-200">{filteredCandidates.length}</span>
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Round {activeRound} Candidates</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-56">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/30 focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Layout Switcher */}
              <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                <button
                  onClick={() => setLayoutMode("list")}
                  className={`p-2 transition ${layoutMode === "list" ? "bg-[#3730a3] text-white shadow-sm" : "hover:bg-slate-100 text-slate-600"}`}
                  title="List View"
                >
                  <FiList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutMode("grid")}
                  className={`p-2 transition ${layoutMode === "grid" ? "bg-[#3730a3] text-white shadow-sm" : "hover:bg-slate-100 text-slate-600"}`}
                  title="Grid View"
                >
                  <FiGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filtering and Bulk Action bar */}
          <div className="px-5 py-3.5 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <span className="text-[10px] font-extrabold text-slate-400 mr-1.5 flex items-center gap-1 shrink-0"><FiFilter className="w-3.5 h-3.5" /> FILTERS:</span>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 ${statusFilter === "all" ? "bg-[#3730a3] text-white" : "hover:bg-slate-200 text-slate-650"}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${statusFilter === "pending" ? "bg-blue-600 text-white" : "hover:bg-slate-200 text-slate-650"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "pending" ? "bg-white" : "bg-blue-500"}`} /> Pending
              </button>
              <button
                onClick={() => setStatusFilter("passed")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${statusFilter === "passed" ? "bg-emerald-600 text-white" : "hover:bg-slate-200 text-slate-650"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "passed" ? "bg-white" : "bg-emerald-500"}`} /> Passed
              </button>
              <button
                onClick={() => setStatusFilter("failed")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${statusFilter === "failed" ? "bg-rose-600 text-white" : "hover:bg-slate-200 text-slate-650"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "failed" ? "bg-white" : "bg-rose-500"}`} /> Failed
              </button>
            </div>

            {/* Bulk Action Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {selectedCandidates.length > 0 ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-xs font-extrabold text-indigo-750 bg-indigo-50 border border-indigo-150 px-2.5 py-1.5 rounded-xl shrink-0">
                    {selectedCandidates.length} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAdvance("pass")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/10 transition"
                    >
                      <FiCheck className="w-3.5 h-3.5" /> Pass
                    </button>
                    <button
                      onClick={() => handleAdvance("fail")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-500/10 transition"
                    >
                      <FiX className="w-3.5 h-3.5" /> Fail
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={selectAll}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-1.5 px-3.5 rounded-xl border border-slate-200 transition text-xs shadow-sm"
                >
                  Select All Pending
                </button>
              )}
            </div>
          </div>

          {/* List/Table View */}
          {layoutMode === "list" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8f9fd] text-[#3730a3] border-b border-slate-200/80">
                    <th className="text-left py-3.5 px-5 font-bold w-12 text-xs">
                      <input
                        type="checkbox"
                        checked={allVisiblePendingSelected()}
                        onChange={handleHeaderCheckboxChange}
                        className="rounded border-slate-300 text-[#3730a3] focus:ring-[#3730a3] w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-3.5 px-4 font-bold uppercase tracking-wider text-xs">Candidate</th>
                    <th className="text-left py-3.5 px-4 font-bold uppercase tracking-wider text-xs">Status</th>
                    <th className="text-left py-3.5 px-4 font-bold uppercase tracking-wider text-xs">Score</th>
                    <th className="text-left py-3.5 px-4 font-bold uppercase tracking-wider text-xs">Remarks / Feedback</th>
                    <th className="text-right py-3.5 px-5 font-bold uppercase tracking-wider text-xs">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(c.student_id?._id || c.student_id)}
                          onChange={() => toggleCandidate(c.student_id?._id || c.student_id)}
                          disabled={c.status === "passed" || c.status === "failed"}
                          className="rounded border-slate-300 text-[#3730a3] focus:ring-[#3730a3] w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs border bg-gradient-to-br ${getAvatarBg(c.student_id?.student_name)}`}>
                            {getInitials(c.student_id?.student_name)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 leading-snug">{c.student_id?.student_name || "Unknown"}</p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{c.student_id?.student_email}</p>
                            {c.student_id?.college_id?.college_name && (
                              <p className="text-[10px] font-bold text-[#3730a3] mt-0.5">
                                {c.student_id.college_id.college_name}
                                {c.student_id?.university_id?.university_name && ` (${c.student_id.university_id.university_name})`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${CANDIDATE_COLORS[c.status]}`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-slate-700">
                        {c.score !== null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs">
                            <FiAward className="w-3.5 h-3.5 text-[#3730a3]/80" />
                            {c.score}{c.max_score ? `/${c.max_score}` : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-650 font-semibold max-w-[200px] truncate" title={c.remarks || ""}>
                        {c.remarks || c.feedback || "-"}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {c.round_type?.includes("interview") || c.round_type === "video_interview" ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setScheduleModal(c)}
                              disabled={c.status !== "pending"}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${c.status === "pending"
                                  ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-250 cursor-pointer"
                                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                }`}
                            >
                              <FiVideo className="w-3.5 h-3.5" /> Schedule
                            </button>
                            <button
                              onClick={() => {
                                setEvaluationModal(c);
                                setEvaluationRating(c.score || 10);
                                setEvaluationNotes(c.remarks || "");
                              }}
                              disabled={c.status !== "completed"}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-xs ${c.status === "completed"
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250 cursor-pointer"
                                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                }`}
                            >
                              <FiCheckCircle className="w-3.5 h-3.5" /> Evaluate
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-350 text-xs font-bold">-</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-16 text-slate-400">
                        <FiUsers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-extrabold text-slate-750 text-base">No candidates found</p>
                        <p className="text-xs text-slate-450 mt-1">Try modifying your search or choosing another filter status.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Grid/Card View */}
          {layoutMode === "grid" && (
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCandidates.map((c) => (
                  <div
                    key={c._id}
                    className={`relative rounded-2xl border p-4 transition-all duration-200 bg-white flex flex-col justify-between group ${selectedCandidates.includes(c.student_id?._id || c.student_id)
                        ? "border-[#3730a3] bg-indigo-50/5 ring-1 ring-[#3730a3]/20 shadow-sm"
                        : "border-slate-200 hover:shadow-md hover:border-slate-300"
                      }`}
                  >
                    {/* Checkbox Overlay */}
                    {c.status !== "passed" && c.status !== "failed" && (
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(c.student_id?._id || c.student_id)}
                        onChange={() => toggleCandidate(c.student_id?._id || c.student_id)}
                        className="absolute top-4 left-4 rounded border-slate-300 text-[#3730a3] focus:ring-[#3730a3] w-4.5 h-4.5 cursor-pointer z-10"
                      />
                    )}

                    {/* Candidate Identity block */}
                    <div className="flex flex-col items-center text-center mt-3 mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border bg-gradient-to-br shadow-inner ${getAvatarBg(c.student_id?.student_name)}`}>
                        {getInitials(c.student_id?.student_name)}
                      </div>
                      <h4 className="font-black text-slate-800 text-sm mt-3 leading-snug">{c.student_id?.student_name || "Unknown"}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{c.student_id?.student_email}</p>
                      {c.student_id?.college_id?.college_name && (
                        <p className="text-[10px] font-extrabold text-[#3730a3] mt-1">
                          {c.student_id.college_id.college_name}
                          {c.student_id?.university_id?.university_name && ` (${c.student_id.university_id.university_name})`}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${CANDIDATE_COLORS[c.status]}`}>
                          {c.status.toUpperCase()}
                        </span>
                        {c.score !== null && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">
                            <FiAward className="w-3 h-3 text-[#3730a3]" /> {c.score}/{c.max_score}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Details and Remarks block */}
                    <div className="border-t border-slate-100 pt-3">
                      {c.remarks || c.feedback ? (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 mb-3 text-left">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Remarks</p>
                          <p className="text-xs font-semibold text-slate-600 mt-0.5 leading-normal line-clamp-2">{c.remarks || c.feedback}</p>
                        </div>
                      ) : (
                        <div className="h-6 flex items-center justify-center text-slate-350 text-[10px] font-bold">No feedback yet</div>
                      )}

                      {/* Inline Actions */}
                      <div className="flex flex-col gap-2 w-full mt-2">
                        {c.round_type?.includes("interview") || c.round_type === "video_interview" ? (
                          <>
                            <button
                              onClick={() => setScheduleModal(c)}
                              disabled={c.status !== "pending"}
                              className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${c.status === "pending"
                                  ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-250 cursor-pointer"
                                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                }`}
                            >
                              <FiVideo className="w-3.5 h-3.5" /> Schedule Interview
                            </button>
                            <button
                              onClick={() => {
                                setEvaluationModal(c);
                                setEvaluationRating(c.score || 10);
                                setEvaluationNotes(c.remarks || "");
                              }}
                              disabled={c.status !== "completed"}
                              className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition shadow-xs ${c.status === "completed"
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250 cursor-pointer"
                                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                }`}
                            >
                              <FiCheckCircle className="w-3.5 h-3.5" /> Evaluate
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredCandidates.length === 0 && (
                  <div className="col-span-full text-center py-16 text-slate-400">
                    <FiUsers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-extrabold text-slate-750 text-base">No candidates found</p>
                    <p className="text-xs text-slate-450 mt-1">Try modifying your search query or switching filter tabs.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-205">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-3">Schedule Video Interview</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Define the scheduled slot for <strong className="text-slate-800 font-extrabold">{scheduleModal.student_id?.student_name}</strong>. Candidates will get notified on their interface.
            </p>
            <div className="mb-5">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Slot Date & Time</label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none transition font-bold text-slate-750 text-xs"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => { setScheduleModal(null); setScheduleDate(""); }}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl border border-slate-200 transition text-xs shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleScheduleInterview(scheduleModal)}
                className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2 px-4 rounded-xl transition shadow-md shadow-indigo-500/10 text-xs flex items-center gap-1.5"
              >
                <FiCalendar className="w-3.5 h-3.5 fill-white" /> Schedule Slot
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Evaluate Candidate Modal */}
      {evaluationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-205">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-3">Evaluate Candidate</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Submit score and feedback for <strong className="text-slate-800 font-extrabold">{evaluationModal.student_id?.student_name}</strong>.
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Rating (1-10)</label>
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEvaluationRating(n)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150 ${n === evaluationRating
                          ? "bg-[#3730a3] text-white shadow-sm shadow-indigo-500/10"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Remarks / Feedback</label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none transition font-semibold text-slate-700 text-xs leading-relaxed"
                  value={evaluationNotes}
                  onChange={(e) => setEvaluationNotes(e.target.value)}
                  placeholder="Enter remarks and observations..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => { setEvaluationModal(null); setEvaluationRating(10); setEvaluationNotes(""); }}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl border border-slate-200 transition text-xs shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvaluation}
                className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2 px-4 rounded-xl transition shadow-md shadow-indigo-500/10 text-xs flex items-center gap-1.5"
              >
                <FiCheckCircle className="w-3.5 h-3.5 fill-white" /> Submit Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundManagement;
