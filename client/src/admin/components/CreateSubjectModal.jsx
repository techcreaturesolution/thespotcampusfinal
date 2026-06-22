import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const CATEGORIES = ["aptitude", "reasoning", "english", "programming", "technical", "general"];

const CreateSubjectModal = ({ isOpen, onClose, subject, onSubmit }) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "technical",
    icon: "",
    sort_order: 0,
  });

  useEffect(() => {
    if (subject) {
      setForm({
        name: subject.name || "",
        description: subject.description || "",
        category: subject.category || "technical",
        icon: subject.icon || "",
        sort_order: subject.sort_order || 0,
      });
    } else {
      setForm({
        name: "",
        description: "",
        category: "technical",
        icon: "",
        sort_order: 0,
      });
    }
  }, [subject]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-100 animate-scale-in text-left">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo_TSC.webp" alt="The Spot Campus" className="h-7 object-contain" />
            <span className="text-slate-300">|</span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {subject ? "Edit Subject" : "Add Subject"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-55 hover:text-slate-700 text-slate-400 transition-all duration-200">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Subject Name
            </label>
            <input
              type="text"
              placeholder="e.g. Quantitative Aptitude"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              placeholder="Provide a brief description of the subject..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Sort Order
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
          </div>

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
              {subject ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubjectModal;
