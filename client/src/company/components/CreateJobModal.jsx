import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp, FiX, FiBriefcase } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";

const ROUND_TYPES = [
  { value: "mcq", label: "MCQ Exam" },
  { value: "technical_interview", label: "Technical Interview" },
  { value: "hr_interview", label: "HR Interview" },
  { value: "coding_test", label: "Coding Test" },
  { value: "group_discussion", label: "Group Discussion" },
  { value: "aptitude_test", label: "Aptitude Test" },
  { value: "video_interview", label: "Video Interview" },
  { value: "assignment", label: "Assignment" },
  { value: "custom", label: "Custom Round" },
];

const INTERVIEW_MODES = [
  { value: "none", label: "Not Applicable" },
  { value: "video_conference", label: "Video Conference (Online)" },
  { value: "in_person", label: "In Person" },
  { value: "phone", label: "Phone Call" },
];

const isInterviewType = (type) =>
  ["technical_interview", "hr_interview", "video_interview"].includes(type);

const CreateJobModal = ({ isOpen, onClose, jobId, onSuccess }) => {
  const isEditMode = !!jobId;
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRounds, setShowRounds] = useState(false);

  const [formData, setFormData] = useState({
    job_title: "", job_position: "", job_type: "Full-Time",
    job_work_mode: "Physical", job_skills: "", job_salary: "",
    job_exp: "", job_noofposition: "", job_desc: "",
    target_degree: [],
    job_location: { country: "India", state: "", city: "" },
  });
  const [rounds, setRounds] = useState([]);
  const [uniqueDegrees, setUniqueDegrees] = useState([]);
  const [collegesForDegree, setCollegesForDegree] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);

  // Fetch unique degrees on mount
  useEffect(() => {
    const fetchUniqueDegrees = async () => {
      try {
        const { data } = await customFetch.get("/dropdown/unique-degrees");
        setUniqueDegrees(data.degrees || []);
      } catch (error) {
        console.error("Failed to fetch unique degrees", error);
      }
    };
    fetchUniqueDegrees();
  }, []);

  // Fetch colleges when target_degree changes
  useEffect(() => {
    if (!formData.target_degree || formData.target_degree.length === 0) {
      setCollegesForDegree([]);
      return;
    }
    const fetchColleges = async () => {
      try {
        const degreesParam = Array.isArray(formData.target_degree)
          ? formData.target_degree.join(",")
          : formData.target_degree;
        const { data } = await customFetch.get(`/dropdown/colleges-by-degree?degree_name=${encodeURIComponent(degreesParam)}`);
        setCollegesForDegree(data.colleges || []);
      } catch (error) {
        console.error("Failed to fetch colleges for degree", error);
      }
    };
    fetchColleges();
  }, [formData.target_degree]);

  // Fetch job details in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;
    const fetchJobDetails = async () => {
      try {
        const { data } = await customFetch.get(`/jobs/${jobId}`);
        const job = data.job;

        let targetDegreeVal = [];
        if (job.target_degree) {
          if (Array.isArray(job.target_degree)) {
            targetDegreeVal = job.target_degree;
          } else if (typeof job.target_degree === "string") {
            targetDegreeVal = job.target_degree.split(",").map(d => d.trim()).filter(Boolean);
          }
        }

        setFormData({
          job_title: job.job_title || "",
          job_position: job.job_position || "",
          job_type: job.job_type || "Full-Time",
          job_work_mode: job.job_work_mode || "Physical",
          job_skills: job.job_skills || "",
          job_salary: job.job_salary || "",
          job_exp: job.job_exp || "",
          job_noofposition: job.job_noofposition || "",
          job_desc: job.job_desc || "",
          target_degree: targetDegreeVal,
          job_location: {
            country: job.job_location?.country || "India",
            state: job.job_location?.state || "",
            city: job.job_location?.city || "",
          },
        });
        setSelectedColleges(job.approved_colleges || []);

        setRounds(job.rounds || []);
        setShowRounds((job.rounds || []).length > 0);
      } catch (error) {
        toast.error("Failed to load job details");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId, isEditMode, onClose]);



  const handleCollegeToggle = (collegeId) => {
    if (selectedColleges.includes(collegeId)) {
      setSelectedColleges(selectedColleges.filter((id) => id !== collegeId));
    } else {
      setSelectedColleges([...selectedColleges, collegeId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.target_degree || formData.target_degree.length === 0) {
      toast.error("Please select at least one target degree.");
      return;
    }
    if (selectedColleges.length === 0) {
      toast.error("Please target at least one college.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        approved_colleges: selectedColleges,
        jobEntries: [],
        has_multiple_rounds: rounds.length > 0,
        ...(isEditMode && rounds.length === 0 && { rounds: [] })
      };

      if (isEditMode) {
        await customFetch.patch(`/jobs/${jobId}`, payload);
        if (rounds.length > 0) {
          await customFetch.post(`/rounds/job/${jobId}/rounds`, { rounds });
        }
        toast.success("Job updated successfully!");
      } else {
        const { data } = await customFetch.post("/jobs", payload);

        if (rounds.length > 0) {
          await customFetch.post(`/rounds/job/${data.job._id}/rounds`, { rounds });
          toast.success("Job created with recruitment rounds!");
        } else {
          toast.success("Job created!");
        }
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.msg || (isEditMode ? "Failed to update job" : "Failed to create job"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("job_location.")) {
      const key = name.split(".")[1];
      setFormData({ ...formData, job_location: { ...formData.job_location, [key]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addRound = () => {
    setRounds([
      ...rounds,
      {
        round_type: "mcq",
        round_name: "",
        round_description: "",
        is_eliminatory: true,
        interview_mode: "none",
        duration_minutes: 60,
      },
    ]);
    setShowRounds(true);
  };

  const updateRound = (index, field, value) => {
    const updated = [...rounds];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "round_type") {
      updated[index].interview_mode = isInterviewType(value) ? "video_conference" : "none";
      if (!updated[index].round_name) {
        updated[index].round_name = ROUND_TYPES.find((r) => r.value === value)?.label || "";
      }
    }
    setRounds(updated);
  };

  const removeRound = (index) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const moveRound = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rounds.length) return;
    const updated = [...rounds];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setRounds(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">

        {/* Sticky Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-[#3730a3] shrink-0">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                {isEditMode ? "Edit Job Opening" : "Create New Job"}
              </h3>
              <p className="text-xs font-semibold text-slate-450 mt-0.5">
                {isEditMode ? "Modify details and target specific university placement cells." : "Post a vacancy and target specific university placement cells."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-450 hover:text-slate-650 hover:bg-slate-50 p-2 rounded-xl transition"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20">
              <Loading />
            </div>
          ) : (
            <form id="job-modal-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Job Details */}
              <div className="bg-[#f8f9ff]/60 rounded-2xl border border-indigo-100/50 p-5 space-y-4">
                <h4 className="text-[10px] font-extrabold text-slate-555 uppercase tracking-wider">Job Details</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Job Title</label>
                    <input type="text" name="job_title" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700" value={formData.job_title} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Position</label>
                    <input type="text" name="job_position" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700" value={formData.job_position} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                    <select name="job_type" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700 cursor-pointer" value={formData.job_type} onChange={handleChange}>
                      <option>Full-Time</option><option>Part-Time</option><option>Internship</option><option>Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Work Mode</label>
                    <select name="job_work_mode" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700 cursor-pointer" value={formData.job_work_mode} onChange={handleChange}>
                      <option>Physical</option><option>Remote</option><option>Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Skills Required</label>
                    <input type="text" name="job_skills" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700" value={formData.job_skills} onChange={handleChange} placeholder="e.g. React, Node.js" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Salary</label>
                    <input type="text" name="job_salary" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700" value={formData.job_salary} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Experience</label>
                    <input type="text" name="job_exp" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700" value={formData.job_exp} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">No. of Positions</label>
                    <input type="text" name="job_noofposition" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700" value={formData.job_noofposition} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">City</label>
                    <input type="text" name="job_location.city" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700" value={formData.job_location.city} onChange={handleChange} placeholder="e.g. Mumbai" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">State</label>
                    <input type="text" name="job_location.state" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700" value={formData.job_location.state} onChange={handleChange} placeholder="e.g. Maharashtra" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Country</label>
                    <input type="text" name="job_location.country" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700" value={formData.job_location.country} onChange={handleChange} placeholder="e.g. India" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Job Description</label>
                  <textarea name="job_desc" rows="4" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none transition text-sm bg-white font-semibold text-slate-700 leading-relaxed" value={formData.job_desc} onChange={handleChange} placeholder="Detailed job description..." required />
                </div>
              </div>

              {/* Campus Targeting & Degree Selection */}
              <div className="bg-[#f8f9ff]/60 rounded-2xl border border-indigo-100/50 p-5 space-y-4">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Campus Targeting</h4>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Target Degrees</label>
                  <div className="flex flex-wrap gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                    {uniqueDegrees.map((deg) => {
                      const isSelected = formData.target_degree.includes(deg);
                      return (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => {
                            let updatedDegrees;
                            if (isSelected) {
                              updatedDegrees = formData.target_degree.filter((d) => d !== deg);
                            } else {
                              updatedDegrees = [...formData.target_degree, deg];
                            }
                            setFormData({ ...formData, target_degree: updatedDegrees });
                          }}
                          className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 ${isSelected
                              ? "bg-[#3730a3] text-white border-[#3730a3] shadow-sm"
                              : "bg-slate-50/60 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                        >
                          {deg}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.target_degree && formData.target_degree.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                      Target Colleges offering {formData.target_degree.join(", ")}
                    </label>
                    {collegesForDegree.length === 0 ? (
                      <p className="text-xs font-semibold text-slate-450 italic">No colleges offering this degree found.</p>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                        {collegesForDegree.map((clg) => (
                          <label key={clg._id} className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={selectedColleges.includes(clg._id)}
                              onChange={() => handleCollegeToggle(clg._id)}
                              className="rounded border-slate-350 text-[#3730a3] focus:ring-[#3730a3] w-4 h-4 cursor-pointer"
                            />
                            <span>{clg.college_name} ({clg.college_code || "N/A"})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Multi-Round Configuration */}
              <div className="bg-[#f8f9ff]/60 rounded-2xl border border-indigo-100/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Recruitment Rounds (Optional)</h4>
                  <button type="button" onClick={addRound} className="bg-white hover:bg-slate-50 text-[#3730a3] border border-slate-200 font-bold py-1.5 px-3.5 rounded-xl transition text-xs flex items-center gap-1.5 shadow-sm active:scale-95">
                    <FiPlus className="w-3.5 h-3.5" /> Add Round
                  </button>
                </div>

                {rounds.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-white">
                    <p className="text-slate-400 text-xs font-semibold">No rounds configured. Job will use single-round selection.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rounds.map((round, index) => (
                      <div key={index} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-[#3730a3] text-white text-xs font-extrabold rounded-full">
                            {index + 1}
                          </span>
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                            <button type="button" onClick={() => moveRound(index, -1)} disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-slate-650 disabled:opacity-30 transition"><FiChevronUp className="w-4 h-4" /></button>
                            <button type="button" onClick={() => moveRound(index, 1)} disabled={index === rounds.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-650 disabled:opacity-30 transition"><FiChevronDown className="w-4 h-4" /></button>
                            <button type="button" onClick={() => removeRound(index)}
                              className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition ml-1"><FiTrash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-3.5">
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Round Type</label>
                            <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white cursor-pointer focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3]" value={round.round_type}
                              onChange={(e) => updateRound(index, "round_type", e.target.value)}>
                              {ROUND_TYPES.map((rt) => (
                                <option key={rt.value} value={rt.value}>{rt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Round Name</label>
                            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={round.round_name}
                              onChange={(e) => updateRound(index, "round_name", e.target.value)}
                              placeholder="e.g. Technical Round 1" required />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Duration (mins)</label>
                            <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={round.duration_minutes}
                              onChange={(e) => updateRound(index, "duration_minutes", parseInt(e.target.value) || 60)}
                              min="5" max="480" />
                          </div>
                        </div>

                        {isInterviewType(round.round_type) && (
                          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">Interview Mode</label>
                            <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-700 cursor-pointer focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3]" value={round.interview_mode}
                              onChange={(e) => updateRound(index, "interview_mode", e.target.value)}>
                              {INTERVIEW_MODES.filter((m) => m.value !== "none").map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                            {round.interview_mode === "video_conference" && (
                              <p className="text-[10px] font-semibold text-blue-600">
                                Built-in secure video conferencing room will be generated.
                              </p>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Description (optional)</label>
                          <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={round.round_description}
                            onChange={(e) => updateRound(index, "round_description", e.target.value)}
                            placeholder="Brief description of this round" />
                        </div>

                        <div className="flex items-center gap-2">
                          <input type="checkbox" id={`elim-${index}`} checked={round.is_eliminatory}
                            onChange={(e) => updateRound(index, "is_eliminatory", e.target.checked)}
                            className="rounded border-slate-350 text-[#3730a3] focus:ring-[#3730a3] w-4 h-4 cursor-pointer" />
                          <label htmlFor={`elim-${index}`} className="text-xxs font-bold text-slate-500 cursor-pointer">
                            Eliminatory (candidates must pass to proceed)
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-5 rounded-xl border border-slate-200 text-sm transition"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="job-modal-form"
            className="vibrant-btn text-white font-bold py-2.5 px-5 rounded-xl transition shadow-md hover:shadow-lg hover:shadow-indigo-500/20 text-sm"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : `Create Job`)}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateJobModal;
