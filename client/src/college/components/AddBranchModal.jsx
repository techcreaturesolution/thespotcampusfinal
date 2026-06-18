import React, { useState, useEffect } from "react";
import { FiX, FiCpu } from "react-icons/fi";

const AddBranchModal = ({ isOpen, onClose, degrees = [], branch, onSubmit }) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    degree_id: "",
    branch_name: "",
    branch_code: "",
  });

  useEffect(() => {
    if (branch) {
      setForm({
        degree_id: branch.degree_id?._id || branch.degree_id || "",
        branch_name: branch.branch_name || "",
        branch_code: branch.branch_code || "",
      });
    } else {
      setForm({
        degree_id: "",
        branch_name: "",
        branch_code: "",
      });
    }
  }, [branch, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      degree_id: form.degree_id,
      branch_name: form.branch_name,
      branch_code: form.branch_code,
    });
    // Reset form
    setForm({
      degree_id: "",
      branch_name: "",
      branch_code: "",
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FiCpu className="text-[#3730a3] w-4.5 h-4.5" /> 
            {branch ? "Edit Specialization Branch" : "Add Specialization Branch"}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-655 hover:bg-slate-100 rounded-lg transition">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Parent Degree Program</label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 bg-white cursor-pointer transition-all duration-200"
              value={form.degree_id}
              onChange={(e) => setForm({ ...form, degree_id: e.target.value })}
              required
            >
              <option value="" className="text-slate-400">Select a Parent Degree</option>
              {degrees.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.degree_name} ({d.degree_code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Branch / Specialization Name</label>
            <input
              type="text"
              placeholder="e.g. Computer Science and Engineering"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all duration-200 bg-white"
              value={form.branch_name}
              onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Branch Code</label>
            <input
              type="text"
              placeholder="e.g. CSE"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all duration-200 bg-white"
              value={form.branch_code}
              onChange={(e) => setForm({ ...form, branch_code: e.target.value })}
              required
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
              {branch ? "Save Changes" : "Add Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBranchModal;
