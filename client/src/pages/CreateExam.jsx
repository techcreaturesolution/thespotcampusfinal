import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FiFileText } from "react-icons/fi";
import customFetch from "../utils/customFetch";

const CreateExam = () => {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "", subject: "", noOfQuestion: 10, timeLimit: 30,
    easy: 30, medium: 40, hard: 30,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.easy + formData.medium + formData.hard !== 100) {
      toast.error("Difficulty percentages must total 100%");
      return;
    }
    setIsSubmitting(true);
    try {
      await customFetch.post("/exam", { ...formData, job_id: jobId });
      toast.success("Exam created successfully!");
      navigate("/dashboard/manage-job");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FiFileText className="w-6 h-6 text-primary-600" /> Create Exam
      </h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
            <input type="text" className="input-field" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input type="text" className="input-field" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. of Questions</label>
            <input type="number" className="input-field" value={formData.noOfQuestion} onChange={(e) => setFormData({ ...formData, noOfQuestion: Number(e.target.value) })} min="1" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (min)</label>
            <input type="number" className="input-field" value={formData.timeLimit} onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })} min="1" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Easy %</label>
            <input type="number" className="input-field" value={formData.easy} onChange={(e) => setFormData({ ...formData, easy: Number(e.target.value) })} min="0" max="100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medium %</label>
            <input type="number" className="input-field" value={formData.medium} onChange={(e) => setFormData({ ...formData, medium: Number(e.target.value) })} min="0" max="100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hard %</label>
            <input type="number" className="input-field" value={formData.hard} onChange={(e) => setFormData({ ...formData, hard: Number(e.target.value) })} min="0" max="100" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Generating..." : "Create Exam"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;
