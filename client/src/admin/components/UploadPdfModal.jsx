import React, { useState, useEffect } from "react";
import { FiX, FiUploadCloud } from "react-icons/fi";
import { toast } from "react-toastify";
import customFetch from "../../utils/customFetch";

const UploadPdfModal = ({ isOpen, onClose, pdf, subjects = [], onSubmit }) => {
  if (!isOpen) return null;

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subject_id: "",
    tags: "",
    total_pages: 0,
    file_url: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await customFetch.get("/preparation/subjects/categories");
        setCategories(data.categories.map((c) => c.name));
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (pdf) {
      setForm({
        title: pdf.title || "",
        description: pdf.description || "",
        category: pdf.category || (categories[0] || ""),
        subject_id: pdf.subject_id?._id || pdf.subject_id || "",
        tags: Array.isArray(pdf.tags) ? pdf.tags.join(", ") : pdf.tags || "",
        total_pages: pdf.total_pages || 0,
        file_url: pdf.file_url || "",
      });
      setFile(null);
    } else {
      setForm({
        title: "",
        description: "",
        category: categories[0] || "",
        subject_id: "",
        tags: "",
        total_pages: 0,
        file_url: "",
      });
      setFile(null);
    }
  }, [pdf, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pdf && !file && !form.file_url.trim()) {
      toast.error("Please upload a PDF file or enter a PDF URL.");
      return;
    }
    onSubmit(form, file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-100 animate-scale-in text-left">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo_TSC.webp" alt="The Spot Campus" className="h-7 object-contain" />
            <span className="text-slate-300">|</span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {pdf ? "Edit PDF Detail" : "Upload PDF Study Material"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-55 hover:text-slate-700 text-slate-400 transition-all duration-200">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Title
              </label>
              <input
                type="text"
                placeholder="e.g. JavaScript Cheat Sheet"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Category
              </label>
              <select
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200 bg-white"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <input
              type="text"
              placeholder="Brief summary of the contents of the study material..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Subject (Optional)
              </label>
              <select
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200 bg-white"
                value={form.subject_id}
                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Total Pages
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.total_pages}
                onChange={(e) => setForm({ ...form, total_pages: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. basics, programming"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
          </div>

          {!pdf && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                PDF File or URL:
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative overflow-hidden inline-block w-full sm:w-auto">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="text-xs font-extrabold text-slate-600 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] font-extrabold text-slate-400">OR</span>
                <input
                  type="text"
                  placeholder="Enter PDF URL instead"
                  value={form.file_url}
                  onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                  className="flex-1 w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-55 text-slate-700 font-extrabold py-2.5 px-5 rounded-xl border border-slate-200 transition-all duration-200 text-[10px] uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md hover:opacity-95 text-[10px] uppercase tracking-wider"
            >
              {pdf ? "Update" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPdfModal;
