import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FiFileText, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const CreateExamModal = ({ isOpen, onClose, jobId, onSuccess }) => {
  if (!isOpen) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "", subject: "", noOfQuestion: 10, timeLimit: 30,
    easy: 30, medium: 40, hard: 30,
  });

  useEffect(() => {
    setFormData({
      title: "", subject: "", noOfQuestion: 10, timeLimit: 30,
      easy: 30, medium: 40, hard: 30,
    });
  }, [jobId]);

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
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FiFileText className="w-5 h-5 text-primary-600" /> Create Exam
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Title</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">No. of Questions</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                value={formData.noOfQuestion}
                onChange={(e) => setFormData({ ...formData, noOfQuestion: Number(e.target.value) })}
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Time Limit (min)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Easy %</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                value={formData.easy}
                onChange={(e) => setFormData({ ...formData, easy: Number(e.target.value) })}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Medium %</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                value={formData.medium}
                onChange={(e) => setFormData({ ...formData, medium: Number(e.target.value) })}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Hard %</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                value={formData.hard}
                onChange={(e) => setFormData({ ...formData, hard: Number(e.target.value) })}
                min="0"
                max="100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 text-sm transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExamModal;
