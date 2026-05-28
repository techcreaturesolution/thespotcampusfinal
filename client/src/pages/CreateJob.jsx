import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import customFetch from "../utils/customFetch";

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

const CreateJob = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRounds, setShowRounds] = useState(false);
  const [formData, setFormData] = useState({
    job_title: "", job_position: "", job_type: "Full-Time",
    job_work_mode: "Physical", job_skills: "", job_salary: "",
    job_exp: "", job_noofposition: "", job_desc: "",
    job_location: { country: "India", state: "", city: "" },
  });
  const [rounds, setRounds] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, has_multiple_rounds: rounds.length > 0 };
      const { data } = await customFetch.post("/jobs", payload);

      if (rounds.length > 0) {
        await customFetch.post(`/rounds/job/${data.job._id}/rounds`, { rounds });
        toast.success("Job created with recruitment rounds!");
      } else {
        toast.success("Job created!");
      }
      navigate("/dashboard/manage-job");
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to create job");
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Job</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Job Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input type="text" name="job_title" className="input-field" value={formData.job_title} onChange={handleChange} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input type="text" name="job_position" className="input-field" value={formData.job_position} onChange={handleChange} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="job_type" className="input-field" value={formData.job_type} onChange={handleChange}>
                <option>Full-Time</option><option>Part-Time</option><option>Internship</option><option>Contract</option>
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
              <select name="job_work_mode" className="input-field" value={formData.job_work_mode} onChange={handleChange}>
                <option>Physical</option><option>Remote</option><option>Hybrid</option>
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Skills Required</label>
              <input type="text" name="job_skills" className="input-field" value={formData.job_skills} onChange={handleChange} placeholder="e.g. React, Node.js" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
              <input type="text" name="job_salary" className="input-field" value={formData.job_salary} onChange={handleChange} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
              <input type="text" name="job_exp" className="input-field" value={formData.job_exp} onChange={handleChange} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">No. of Positions</label>
              <input type="text" name="job_noofposition" className="input-field" value={formData.job_noofposition} onChange={handleChange} /></div>
          </div>
          <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea name="job_desc" rows="5" className="input-field" value={formData.job_desc} onChange={handleChange} placeholder="Detailed job description..." required /></div>
        </div>

        {/* Multi-Round Configuration */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Recruitment Rounds</h2>
              <p className="text-sm text-gray-500 mt-1">Define multi-round selection process (optional)</p>
            </div>
            <button type="button" onClick={addRound} className="btn-primary text-sm flex items-center gap-1">
              <FiPlus className="w-4 h-4" /> Add Round
            </button>
          </div>

          {rounds.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-400">No rounds configured. Job will use single-round selection.</p>
              <button type="button" onClick={addRound} className="text-primary-600 text-sm mt-2 hover:underline">
                + Add recruitment rounds
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rounds.map((round, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-primary-600 text-white text-sm font-bold rounded-full">
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveRound(index, -1)} disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><FiChevronUp /></button>
                      <button type="button" onClick={() => moveRound(index, 1)} disabled={index === rounds.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><FiChevronDown /></button>
                      <button type="button" onClick={() => removeRound(index)}
                        className="p-1 text-red-400 hover:text-red-600 ml-2"><FiTrash2 /></button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Round Type</label>
                      <select className="input-field text-sm" value={round.round_type}
                        onChange={(e) => updateRound(index, "round_type", e.target.value)}>
                        {ROUND_TYPES.map((rt) => (
                          <option key={rt.value} value={rt.value}>{rt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Round Name</label>
                      <input type="text" className="input-field text-sm" value={round.round_name}
                        onChange={(e) => updateRound(index, "round_name", e.target.value)}
                        placeholder="e.g. Technical Round 1" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Duration (mins)</label>
                      <input type="number" className="input-field text-sm" value={round.duration_minutes}
                        onChange={(e) => updateRound(index, "duration_minutes", parseInt(e.target.value) || 60)}
                        min="5" max="480" />
                    </div>
                  </div>

                  {isInterviewType(round.round_type) && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <label className="block text-xs font-medium text-blue-700 mb-1">Interview Mode</label>
                      <select className="input-field text-sm" value={round.interview_mode}
                        onChange={(e) => updateRound(index, "interview_mode", e.target.value)}>
                        {INTERVIEW_MODES.filter((m) => m.value !== "none").map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      {round.interview_mode === "video_conference" && (
                        <p className="text-xs text-blue-600 mt-1">
                          Built-in video conference will be used for this round.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                    <input type="text" className="input-field text-sm" value={round.round_description}
                      onChange={(e) => updateRound(index, "round_description", e.target.value)}
                      placeholder="Brief description of this round" />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input type="checkbox" id={`elim-${index}`} checked={round.is_eliminatory}
                      onChange={(e) => updateRound(index, "is_eliminatory", e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <label htmlFor={`elim-${index}`} className="text-xs text-gray-600">
                      Eliminatory (candidates must pass to proceed)
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : `Create Job${rounds.length > 0 ? ` with ${rounds.length} Round${rounds.length > 1 ? "s" : ""}` : ""}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJob;
