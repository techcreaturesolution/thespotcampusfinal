import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUser, FiShield, FiAlertTriangle, FiClock, FiArrowLeft, FiAward, 
  FiEye, FiCheckCircle, FiFileText, FiSearch, FiMonitor, FiMapPin, 
  FiCalendar, FiCpu, FiExternalLink, FiXCircle, FiFilter, FiMaximize2, FiMinimize2,
  FiCheck, FiX
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import RefreshButton from "../../common/components/RefreshButton";

const ExamResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useOutletContext() || {};
  const [papers, setPapers] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, high, moderate, flagged
  const [expandedPaperId, setExpandedPaperId] = useState(null);

  const fetchResults = async () => {
    try {
      const { data } = await customFetch.get(`/paper/${id}`);
      setPapers(data.papers || []);
      if (data.exam) {
        setExam(data.exam);
      }
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [id]);

  const handleAdvance = async (studentId, action) => {
    try {
      const jobId = exam?.job_id?._id || exam?.job_id;
      if (!jobId) {
        toast.error("Job ID not found");
        return;
      }
      await customFetch.post(`/rounds/job/${jobId}/advance`, {
        student_ids: [studentId],
        current_round: 1,
        action,
      });
      toast.success(
        action === "pass" 
          ? (exam?.job_id?.has_multiple_rounds ? "Promoted to next round" : "Candidate selected")
          : (exam?.job_id?.has_multiple_rounds ? "Candidate eliminated" : "Candidate rejected")
      );
      fetchResults();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update candidate status");
    }
  };


  const getTrustScoreTier = (score) => {
    const s = score ?? 100;
    if (s >= 80) return { label: "Excellent Trust", bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500", text: "text-emerald-700" };
    if (s >= 55) return { label: "Moderate Trust", bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500", text: "text-amber-700" };
    return { label: "Suspicious Activity", bg: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500", text: "text-rose-700" };
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "submitted":
        return "bg-emerald-50 text-emerald-700 border-emerald-150";
      case "auto_submitted":
        return "bg-rose-50 text-rose-700 border-rose-150 animate-pulse";
      default:
        return "bg-amber-50 text-amber-700 border-amber-150";
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatTimeSpent = (seconds) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}m ${remaining}s`;
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalSubmissions = papers.length;
  const submissionsWithScore = papers.filter((p) => typeof p.score === "number");
  const avgScore = submissionsWithScore.length
    ? (submissionsWithScore.reduce((sum, p) => sum + p.score, 0) / submissionsWithScore.length).toFixed(1)
    : "—";

  const highTrustCount = papers.filter((p) => (p.proctoring?.trustScore ?? 100) >= 80).length;
  const trustRate = totalSubmissions > 0 
    ? ((highTrustCount / totalSubmissions) * 100).toFixed(0) 
    : 100;

  const flaggedCount = papers.filter(p => 
    (p.proctoring?.trustScore ?? 100) < 55 || (p.proctoring?.totalViolations || 0) > 3
  ).length;

  const filteredPapers = papers.filter((p) => {
    const term = searchQuery.toLowerCase();
    const nameMatch = p.student_id?.student_name?.toLowerCase().includes(term);
    const emailMatch = p.student_id?.student_email?.toLowerCase().includes(term);
    const searchMatch = !searchQuery || nameMatch || emailMatch;

    const trustScore = p.proctoring?.trustScore ?? 100;
    const totalViolations = p.proctoring?.totalViolations || 0;

    let statusMatch = true;
    if (statusFilter === "high") statusMatch = trustScore >= 80;
    else if (statusFilter === "moderate") statusMatch = trustScore >= 55 && trustScore < 80;
    else if (statusFilter === "flagged") statusMatch = trustScore < 55 || totalViolations > 3;

    return searchMatch && statusMatch;
  });

  const toggleExpand = (paperId) => {
    setExpandedPaperId(expandedPaperId === paperId ? null : paperId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3730a3]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-all duration-200 border border-slate-200 bg-white shadow-sm shrink-0"
            title="Go Back"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              Exam Submissions
            </h1>
            <p className="text-xs font-semibold text-slate-500">Review student performance metrics and AI proctoring logs.</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <RefreshButton />
        </div>
      </div>

      {/* KPI Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Submissions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Submissions</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalSubmissions}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#3730a3] flex items-center justify-center shadow-sm">
              <FiFileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-indigo-650">Active Round 1</span>
            <span>submissions received</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Average Score</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {avgScore} <span className="text-sm font-semibold text-slate-400">/ {exam?.noOfQuestion || exam?.questions?.length || "—"}</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center shadow-sm">
              <FiAward className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-blue-600">Dynamic Mean</span>
            <span>across all exam attempts</span>
          </div>
        </div>

        {/* High Trust Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">High Trust Rate</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{trustRate}%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-650 flex items-center justify-center shadow-sm">
              <FiShield className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-emerald-600">{highTrustCount} Students</span>
            <span>with $\ge 80\%$ trust score</span>
          </div>
        </div>

        {/* Flagged Cases */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Flagged Cases</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">{flaggedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-650 flex items-center justify-center shadow-sm">
              <FiAlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`font-bold ${flaggedCount > 0 ? "text-rose-600" : "text-slate-500"}`}>
              {flaggedCount > 0 ? "Review Required" : "Clean History"}
            </span>
            <span>trust violations or anomalies</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search student by name, email..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/30 focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto self-start md:self-auto pb-1 md:pb-0">
          <span className="text-xs font-extrabold text-slate-450 flex items-center gap-1 shrink-0 mr-2">
            <FiFilter className="w-3.5 h-3.5" /> FILTER BY:
          </span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              statusFilter === "all"
                ? "bg-[#3730a3] text-white shadow-sm"
                : "bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200/60"
            }`}
          >
            All Submissions
          </button>
          <button
            onClick={() => setStatusFilter("high")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              statusFilter === "high"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 hover:bg-emerald-100/75 text-emerald-800 border border-emerald-150"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "high" ? "bg-white" : "bg-emerald-500"}`} /> High Trust
          </button>
          <button
            onClick={() => setStatusFilter("moderate")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              statusFilter === "moderate"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 hover:bg-amber-100/75 text-amber-800 border border-amber-150"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "moderate" ? "bg-white" : "bg-amber-500"}`} /> Mod. Trust
          </button>
          <button
            onClick={() => setStatusFilter("flagged")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              statusFilter === "flagged"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-rose-50 hover:bg-rose-100/75 text-rose-800 border border-rose-150"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "flagged" ? "bg-white" : "bg-rose-500"}`} /> Suspicious
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredPapers.map((paper) => {
          const trust = getTrustScoreTier(paper.proctoring?.trustScore);
          const isExpanded = expandedPaperId === paper._id;
          
          return (
            <div
              key={paper._id}
              className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden ${
                isExpanded 
                  ? "border-[#3730a3] ring-1 ring-[#3730a3]/20" 
                  : "border-slate-200/80 hover:shadow-md hover:border-slate-300"
              }`}
            >
              {/* Outer Card Row */}
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100/50">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-50 to-indigo-100 text-[#3730a3] rounded-xl flex items-center justify-center shrink-0 font-extrabold border border-indigo-200/50 shadow-inner">
                    {getInitials(paper.student_id?.student_name)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug">
                      {paper.student_id?.student_name || "Student"}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{paper.student_id?.student_email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:justify-end">
                  {/* Score */}
                  <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-150 text-center min-w-[85px] shadow-sm">
                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Score</p>
                    <p className="text-lg font-black text-[#3730a3] mt-0.5 flex items-center justify-center gap-1">
                      <FiAward className="w-4 h-4 text-[#3730a3]/85" /> {paper.score} <span className="text-xs font-semibold text-slate-400">/ {exam?.noOfQuestion || exam?.questions?.length || "—"}</span>
                    </p>
                  </div>

                  {/* Trust Score */}
                  <div className={`px-4 py-2 rounded-xl border ${trust.bg} text-center min-w-[125px] shadow-sm`}>
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-85">Trust Score</p>
                    <p className="text-lg font-black mt-0.5 flex items-center justify-center gap-1">
                      <FiShield className="w-4 h-4" /> {paper.proctoring?.trustScore ?? 100}%
                    </p>
                  </div>

                  {/* Violations */}
                  <div className={`px-3.5 py-2 rounded-xl border text-center min-w-[85px] shadow-sm ${
                    (paper.proctoring?.totalViolations || 0) > 0 
                      ? "bg-rose-50 border-rose-150 text-rose-700" 
                      : "bg-slate-50 border-slate-150 text-slate-650"
                  }`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">Violations</p>
                    <p className="text-lg font-black mt-0.5 flex items-center justify-center gap-1">
                      <FiAlertTriangle className="w-4 h-4" /> {paper.proctoring?.totalViolations || 0}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-start sm:items-center">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${getStatusStyle(paper.status)}`}>
                      {paper.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Company Action Buttons */}
                  {role === "Company" && (
                    <div className="flex items-center gap-2">
                      {exam?.job_id?.has_multiple_rounds && exam?.job_id?.rounds?.length > 0 ? (
                        // Case: Job has multiple rounds
                        paper.candidateRound?.status === "passed" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
                            <FiCheck className="w-3.5 h-3.5 animate-bounce" /> Passed to Next Round
                          </span>
                        ) : paper.candidateRound?.status === "failed" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 shadow-sm">
                            <FiX className="w-3.5 h-3.5" /> Eliminated
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAdvance(paper.student_id?._id, "pass")}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95 hover:scale-[1.02]"
                            >
                              <FiCheck className="w-3.5 h-3.5" /> Promote to Next Round
                            </button>
                            <button
                              onClick={() => handleAdvance(paper.student_id?._id, "fail")}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition active:scale-95 hover:scale-[1.02]"
                            >
                              <FiX className="w-3.5 h-3.5" /> Eliminate
                            </button>
                          </>
                        )
                      ) : (
                        // Case: Job has NO rounds (direct evaluation)
                        paper.application?.final_result === "selected" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
                            <FiCheckCircle className="w-3.5 h-3.5" /> Selected
                          </span>
                        ) : paper.application?.final_result === "rejected" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 shadow-sm">
                            <FiXCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAdvance(paper.student_id?._id, "pass")}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95 hover:scale-[1.02]"
                            >
                              <FiCheck className="w-3.5 h-3.5" /> Select Student
                            </button>
                            <button
                              onClick={() => handleAdvance(paper.student_id?._id, "fail")}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition active:scale-95 hover:scale-[1.02]"
                            >
                              <FiX className="w-3.5 h-3.5" /> Reject Student
                            </button>
                          </>
                        )
                      )}
                    </div>
                  )}

                  {/* Toggle Button */}
                  <button
                    onClick={() => toggleExpand(paper._id)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      isExpanded
                        ? "bg-[#3730a3] text-white border-[#3730a3] shadow-md shadow-indigo-500/10"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
                    }`}
                  >
                    {isExpanded ? (
                      <>
                        <FiMinimize2 className="w-3.5 h-3.5" /> Hide Logs
                      </>
                    ) : (
                      <>
                        <FiMaximize2 className="w-3.5 h-3.5" /> Inspect Proctoring
                      </>
                    )}
                  </button>

                </div>
              </div>

              {/* Collapsible Details Drawer */}
              {isExpanded && (
                <div className="bg-slate-50/70 border-t border-slate-100 p-5 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: Session Metadata */}
                    <div className="bg-white rounded-xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-[#3730a3] uppercase tracking-wider flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                          <FiMonitor className="w-4 h-4" /> Session Metadata
                        </h4>
                        <div className="space-y-3.5">
                          <div className="flex items-start gap-3">
                            <FiClock className="w-4 h-4 text-slate-450 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Duration</p>
                              <p className="text-xs font-bold text-slate-700 mt-0.5">
                                {formatTimeSpent(paper.proctoring?.totalTimeSpentSeconds)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <FiCalendar className="w-4 h-4 text-slate-450 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Time</p>
                              <p className="text-xs font-bold text-slate-700 mt-0.5">
                                {formatDate(paper.proctoring?.startedAt) || "-"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <FiCheckCircle className="w-4 h-4 text-slate-450 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submission Time</p>
                              <p className="text-xs font-bold text-slate-700 mt-0.5">
                                {formatDate(paper.proctoring?.submittedAt) || "-"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <FiCpu className="w-4 h-4 text-slate-450 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Device / Browser</p>
                              <p className="text-xs font-bold text-slate-700 mt-0.5 leading-relaxed break-words line-clamp-2" title={paper.proctoring?.browserInfo}>
                                {paper.proctoring?.browserInfo || "Generic Browser"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {paper.proctoring?.autoSubmitted && (
                        <div className="mt-4 p-3 bg-rose-50 border border-rose-150 rounded-xl">
                          <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FiXCircle className="w-3.5 h-3.5" /> Auto-Submitted by AI
                          </p>
                          <p className="text-xs font-semibold text-rose-700 mt-1 leading-normal">
                            Reason: {paper.proctoring?.autoSubmitReason || "Max violations exceeded"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Violations Timeline */}
                    <div className="bg-white rounded-xl border border-slate-200/70 p-4 shadow-sm flex flex-col">
                      <h4 className="text-xs font-extrabold text-[#3730a3] uppercase tracking-wider flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100 shrink-0">
                        <FiAlertTriangle className="w-4 h-4 text-rose-500" /> Focus Log Timeline
                      </h4>
                      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1.5 scrollbar-thin">
                        {(!paper.proctoring?.violations || paper.proctoring.violations.length === 0) ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                            <FiCheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                            <p className="text-xs font-bold text-slate-700">Perfect Proctoring Record</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">No violations or anomalies recorded.</p>
                          </div>
                        ) : (
                          <div className="relative pl-4 border-l border-slate-150 space-y-4 ml-1.5 py-1">
                            {paper.proctoring.violations.map((v, i) => {
                              const isRed = ["tab_switch", "face_not_detected", "multiple_faces", "devtools_open"].includes(v.type);
                              return (
                                <div key={i} className="relative group">
                                  {/* Timeline marker */}
                                  <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-2 ${
                                    isRed ? "bg-rose-500 ring-rose-100" : "bg-amber-500 ring-amber-100"
                                  }`} />
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800">
                                      {v.type?.replace("_", " ")}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {formatTimestamp(v.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-normal">
                                    {v.details || "Anomaly detected"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Web-Snapshots Grid */}
                    <div className="bg-white rounded-xl border border-slate-200/70 p-4 shadow-sm flex flex-col">
                      <h4 className="text-xs font-extrabold text-[#3730a3] uppercase tracking-wider flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100 shrink-0">
                        <FiEye className="w-4 h-4 text-[#3730a3]" /> Webcam Snapshots
                      </h4>
                      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1.5 scrollbar-thin">
                        {(!paper.proctoring?.cameraSnapshots || paper.proctoring.cameraSnapshots.length === 0) ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                            <FiMonitor className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-xs font-bold text-slate-700">No Snapshot Captures</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Camera monitoring was disabled or unavailable.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {paper.proctoring.cameraSnapshots.map((snap, idx) => {
                              const alertSnapshot = !snap.faceDetected || snap.multipleFaces;
                              return (
                                <div
                                  key={idx}
                                  className={`relative group rounded-lg overflow-hidden border bg-slate-50 ${
                                    alertSnapshot ? "border-rose-350 shadow-sm" : "border-slate-200"
                                  }`}
                                >
                                  {snap.imageUrl ? (
                                    <img
                                      src={snap.imageUrl}
                                      alt="Webcam Snapshot"
                                      className="w-full h-16 object-cover hover:scale-105 transition-transform duration-200"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-16 flex items-center justify-center text-slate-350 text-[10px] font-bold">
                                      No Image
                                    </div>
                                  )}
                                  
                                  {/* Badge Overlay */}
                                  <div className="absolute top-1 left-1 flex flex-wrap gap-0.5">
                                    {alertSnapshot && (
                                      <span className="bg-rose-600 text-white text-[7px] font-black uppercase tracking-wider px-1 rounded shadow-sm">
                                        {!snap.faceDetected ? "No Face" : "Multi Face"}
                                      </span>
                                    )}
                                  </div>

                                  <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">
                                    <span>#{idx + 1}</span>
                                    <span>{formatTimestamp(snap.timestamp)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredPapers.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
            <FiFileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-extrabold text-slate-700 text-base">No submissions match the filters</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or resetting the status filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResult;
