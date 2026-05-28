import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import customFetch from "../utils/customFetch";

const CreateJob = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    job_title: "", job_position: "", job_type: "Full-Time",
    job_work_mode: "Physical", job_skills: "", job_salary: "",
    job_exp: "", job_noofposition: "", job_desc: "",
    job_location: { country: "India", state: "", city: "" },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await customFetch.post("/jobs", formData);
      toast.success("Job created!");
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

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Job</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
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
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
          <textarea name="job_desc" rows="5" className="input-field" value={formData.job_desc} onChange={handleChange} placeholder="Detailed job description..." required /></div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Job"}</button>
        </div>
      </form>
    </div>
  );
};

export default CreateJob;
