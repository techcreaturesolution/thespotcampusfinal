import React, { useState, useEffect } from "react";
import { FiX, FiBookOpen } from "react-icons/fi";

const AddDegreeModal = ({ isOpen, onClose, degree, onSubmit }) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    degree_name: "",
    degree_code: "",
    degree_sem: "6",
  });

  useEffect(() => {
    if (degree) {
      setForm({
        degree_name: degree.degree_name || "",
        degree_code: degree.degree_code || "",
        degree_sem: degree.degree_sem ? degree.degree_sem.toString() : "6",
      });
    } else {
      setForm({
        degree_name: "",
        degree_code: "",
        degree_sem: "6",
      });
    }
  }, [degree, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      degree_name: form.degree_name,
      degree_code: form.degree_code,
      degree_sem: Number(form.degree_sem),
    });
    // Reset form
    setForm({
      degree_name: "",
      degree_code: "",
      degree_sem: "6",
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FiBookOpen className="text-[#3730a3] w-4.5 h-4.5" /> 
            {degree ? "Edit Degree Program" : "Add New Degree Program"}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg transition">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Degree Name</label>
            <input
              type="text"
              placeholder="e.g. Bachelor of Computer Applications"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all duration-200 bg-white"
              value={form.degree_name}
              onChange={(e) => setForm({ ...form, degree_name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Degree Code / Abbreviation</label>
            <input
              type="text"
              placeholder="e.g. BCA"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all duration-200 bg-white"
              value={form.degree_code}
              onChange={(e) => setForm({ ...form, degree_code: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Total Semesters</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all duration-200 bg-white"
              value={form.degree_sem}
              onChange={(e) => setForm({ ...form, degree_sem: e.target.value })}
              required
              min="1"
              max="12"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-50 text-slate-755 font-bold py-2 px-4 rounded-xl border border-slate-200 transition text-xs shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2 px-4 rounded-xl transition shadow-md shadow-indigo-500/10 text-xs flex items-center gap-1.5"
            >
              {degree ? "Save Changes" : "Add Degree"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDegreeModal;
