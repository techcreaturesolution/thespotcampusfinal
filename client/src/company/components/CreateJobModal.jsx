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
  if (!isOpen) return null;

  const isEditMode = !!jobId;
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRounds, setShowRounds] = useState(false);
  
  const [formData, setFormData] = useState({
    job_title: "", job_position: "", job_type: "Full-Time",
    job_work_mode: "Physical", job_skills: "", job_salary: "",
    job_exp: "", job_noofposition: "", job_desc: "",
    job_location: { country: "India", state: "", city: "" },
  });
  const [rounds, setRounds] = useState([]);

  // Targeting States
  const [universities, setUniversities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [targetEntries, setTargetEntries] = useState([]);
  const [currentTarget, setCurrentTarget] = useState({
    university_id: "", university_name: "",
    college_id: "", college_name: "",
    degree_id: "", degree_name: "",
    branch_id: "", branch_name: ""
  });

  // Load universities on mount
  useEffect(() => {
    customFetch.get("/dropdown/universities").then(({ data }) => setUniversities(data.universities || []));
  }, []);

  // Fetch job details in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;
    const fetchJobDetails = async () => {
      try {
        const { data } = await customFetch.get(`/jobs/${jobId}`);
        const job = data.job;
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
          job_location: {
            country: job.job_location?.country || "India",
            state: job.job_location?.state || "",
            city: job.job_location?.city || "",
          },
        });

        // Map placement targets
        const targets = (job.job_college || []).map((t) => ({
          university_id: t.job_university_id?._id || t.job_university_id || "",
          university_name: t.job_university_id?.university_name || "Unknown University",
          college_id: t.job_college_id?._id || t.job_college_id || "",
          college_name: t.job_college_id?.college_name || "Unknown College",
          degree_id: t.job_degree_id?._id || t.job_degree_id || "",
          degree_name: t.job_degree_id?.degree_name || "Unknown Degree",
          branch_id: t.job_branch_id?._id || t.job_branch_id || "",
          branch_name: t.job_branch_id?.branch_name || "Unknown Branch",
        }));
        setTargetEntries(targets);
      } catch (error) {
        toast.error("Failed to load job details");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId, isEditMode, onClose]);

  // Load colleges when university changes
  useEffect(() => {
    if (currentTarget.university_id) {
      customFetch.get(`/dropdown/colleges?university_id=${currentTarget.university_id}`).then(({ data }) => setColleges(data.colleges || []));
    } else {
      setColleges([]);
      setDegrees([]);
      setBranches([]);
    }
  }, [currentTarget.university_id]);

  // Load degrees when college changes
  useEffect(() => {
    if (currentTarget.college_id) {
      customFetch.get(`/dropdown/degrees?college_id=${currentTarget.college_id}`).then(({ data }) => setDegrees(data.degrees || []));
    } else {
      setDegrees([]);
      setBranches([]);
    }
  }, [currentTarget.college_id]);

  // Load branches when degree changes
  useEffect(() => {
    if (currentTarget.degree_id) {
      customFetch.get(`/dropdown/branches?degree_id=${currentTarget.degree_id}&college_id=${currentTarget.college_id}`).then(({ data }) => setBranches(data.branches || []));
    } else {
      setBranches([]);
    }
  }, [currentTarget.degree_id, currentTarget.college_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (targetEntries.length === 0) {
      toast.warning("Please add at least one placement target college");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        jobEntries: targetEntries.map(t => ({
          job_university_id: t.university_id,
          job_college_id: t.college_id,
          job_degree_id: t.degree_id,
          job_branch_id: t.branch_id
        })),
        ...(!isEditMode && { has_multiple_rounds: rounds.length > 0 })
      };

      if (isEditMode) {
        await customFetch.patch(`/jobs/${jobId}`, payload);
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

  const addTarget = () => {
    if (!currentTarget.university_id || !currentTarget.college_id || !currentTarget.degree_id || !currentTarget.branch_id) {
      toast.warning("Please select all targeting fields");
      return;
    }
    setTargetEntries([...targetEntries, currentTarget]);
    // Reset selections
    setCurrentTarget({
      university_id: "", university_name: "",
      college_id: "", college_name: "",
      degree_id: "", degree_name: "",
      branch_id: "", branch_name: ""
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-150 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEditMode ? "Edit Job Opening" : "Create New Job"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEditMode ? "Modify details and target specific university placement cells." : "Post a vacancy and target specific university placement cells."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition"
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
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Job Details</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Job Title</label>
                    <input type="text" name="job_title" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition text-sm bg-white" value={formData.job_title} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Position</label>
                    <input type="text" name="job_position" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition text-sm bg-white" value={formData.job_position} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                    <select name="job_type" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition text-sm bg-white" value={formData.job_type} onChange={handleChange}>
                      <option>Full-Time</option><option>Part-Time</option><option>Internship</option><option>Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Work Mode</label>
                    <select name="job_work_mode" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition text-sm bg-white" value={formData.job_work_mode} onChange={handleChange}>
                      <option>Physical</option><option>Remote</option><option>Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Skills Required</label>
                    <input type="text" name="job_skills" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition text-sm bg-white" value={formData.job_skills} onChange={handleChange} placeholder="e.g. React, Node.js" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Salary</label>
                    <input type="text" name="job_salary" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition text-sm bg-white" value={formData.job_salary} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Experience</label>
                    <input type="text" name="job_exp" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition text-sm bg-white" value={formData.job_exp} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">No. of Positions</label>
                    <input type="text" name="job_noofposition" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition text-sm bg-white" value={formData.job_noofposition} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Job Description</label>
                  <textarea name="job_desc" rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition text-sm bg-white" value={formData.job_desc} onChange={handleChange} placeholder="Detailed job description..." required />
                </div>
              </div>

              {/* Placement Targets */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Placement Targets</h4>
                
                <div className="grid md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xxs font-semibold text-gray-500 mb-0.5">University</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                      value={currentTarget.university_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = universities.find(u => u._id === id)?.university_name || "";
                        setCurrentTarget({ ...currentTarget, university_id: id, university_name: name, college_id: "", college_name: "", degree_id: "", degree_name: "", branch_id: "", branch_name: "" });
                      }}
                    >
                      <option value="">Select University</option>
                      {universities.map(u => <option key={u._id} value={u._id}>{u.university_name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xxs font-semibold text-gray-500 mb-0.5">College</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                      value={currentTarget.college_id}
                      disabled={!currentTarget.university_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = colleges.find(c => c._id === id)?.college_name || "";
                        setCurrentTarget({ ...currentTarget, college_id: id, college_name: name, degree_id: "", degree_name: "", branch_id: "", branch_name: "" });
                      }}
                    >
                      <option value="">Select College</option>
                      {colleges.map(c => <option key={c._id} value={c._id}>{c.college_name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xxs font-semibold text-gray-500 mb-0.5">Degree</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                      value={currentTarget.degree_id}
                      disabled={!currentTarget.college_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = degrees.find(d => d._id === id)?.degree_name || "";
                        setCurrentTarget({ ...currentTarget, degree_id: id, degree_name: name, branch_id: "", branch_name: "" });
                      }}
                    >
                      <option value="">Select Degree</option>
                      {degrees.map(d => <option key={d._id} value={d._id}>{d.degree_name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xxs font-semibold text-gray-500 mb-0.5">Branch</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                      value={currentTarget.branch_id}
                      disabled={!currentTarget.degree_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = branches.find(b => b._id === id)?.branch_name || "";
                        setCurrentTarget({ ...currentTarget, branch_id: id, branch_name: name });
                      }}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => <option key={b._id} value={b._id}>{b.branch_name}</option>)}
                    </select>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={addTarget}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xxs transition"
                >
                  + Add Target College
                </button>
                
                {/* Target List */}
                {targetEntries.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-150 bg-white overflow-hidden max-h-48 overflow-y-auto">
                    {targetEntries.map((entry, index) => (
                      <div key={index} className="p-3 flex items-center justify-between text-xs text-gray-600">
                        <div className="flex-1 min-w-0 pr-4">
                          <span className="font-bold text-gray-800 block text-xs truncate">{entry.college_name}</span>
                          <span className="text-xxs text-gray-400 block truncate">{entry.university_name} &bull; {entry.degree_name} ({entry.branch_name})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTargetEntries(targetEntries.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 bg-white">
                    No colleges targeted yet. Add at least one college target to save the job opening.
                  </div>
                )}
              </div>

              {/* Multi-Round Configuration */}
              {!isEditMode && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Recruitment Rounds (Optional)</h4>
                    <button type="button" onClick={addRound} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 rounded-lg transition text-xs flex items-center gap-1">
                      <FiPlus className="w-3.5 h-3.5" /> Add Round
                    </button>
                  </div>

                  {rounds.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg bg-white">
                      <p className="text-gray-400 text-xs">No rounds configured. Job will use single-round selection.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rounds.map((round, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-600 text-white text-xs font-bold rounded-full">
                              {index + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => moveRound(index, -1)} disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><FiChevronUp /></button>
                              <button type="button" onClick={() => moveRound(index, 1)} disabled={index === rounds.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><FiChevronDown /></button>
                              <button type="button" onClick={() => removeRound(index)}
                                className="p-1 text-red-400 hover:text-red-600 ml-1"><FiTrash2 /></button>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xxs font-medium text-gray-500 mb-0.5">Round Type</label>
                              <select className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs" value={round.round_type}
                                onChange={(e) => updateRound(index, "round_type", e.target.value)}>
                                {ROUND_TYPES.map((rt) => (
                                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xxs font-medium text-gray-500 mb-0.5">Round Name</label>
                              <input type="text" className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs" value={round.round_name}
                                onChange={(e) => updateRound(index, "round_name", e.target.value)}
                                placeholder="e.g. Technical Round 1" required />
                            </div>
                            <div>
                              <label className="block text-xxs font-medium text-gray-500 mb-0.5">Duration (mins)</label>
                              <input type="number" className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs" value={round.duration_minutes}
                                onChange={(e) => updateRound(index, "duration_minutes", parseInt(e.target.value) || 60)}
                                min="5" max="480" />
                            </div>
                          </div>

                          {isInterviewType(round.round_type) && (
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                              <label className="block text-xxs font-semibold text-blue-700 mb-1">Interview Mode</label>
                              <select className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white" value={round.interview_mode}
                                onChange={(e) => updateRound(index, "interview_mode", e.target.value)}>
                                {INTERVIEW_MODES.filter((m) => m.value !== "none").map((m) => (
                                  <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                              </select>
                              {round.interview_mode === "video_conference" && (
                                <p className="text-xxs text-blue-600 mt-1">
                                  Built-in video conference will be used for this round.
                                </p>
                              )}
                            </div>
                          )}

                          <div>
                            <label className="block text-xxs font-medium text-gray-500 mb-0.5">Description (optional)</label>
                            <input type="text" className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs" value={round.round_description}
                               onChange={(e) => updateRound(index, "round_description", e.target.value)}
                               placeholder="Brief description of this round" />
                          </div>

                          <div className="flex items-center gap-2">
                            <input type="checkbox" id={`elim-${index}`} checked={round.is_eliminatory}
                              onChange={(e) => updateRound(index, "is_eliminatory", e.target.checked)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            <label htmlFor={`elim-${index}`} className="text-xxs text-gray-500">
                              Eliminatory (candidates must pass to proceed)
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-6 border-t border-gray-150 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            className="bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-5 rounded-lg border border-gray-300 text-sm transition"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="job-modal-form"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-5 rounded-lg transition shadow-md"
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
