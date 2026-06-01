import React, { useState } from "react";
import { FiX } from "react-icons/fi";

const AddBranchModal = ({ isOpen, onClose, degrees, onSubmit }) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    degree_id: "",
    branch_name: "",
    branch_code: "",
  });

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New Branch</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Degree</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
              value={form.degree_id}
              onChange={(e) => setForm({ ...form, degree_id: e.target.value })}
              required
            >
              <option value="">Select a Degree</option>
              {degrees.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.degree_name} ({d.degree_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
            <input
              type="text"
              placeholder="e.g. Computer Science and Engineering"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              value={form.branch_name}
              onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
            <input
              type="text"
              placeholder="e.g. CSE"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              value={form.branch_code}
              onChange={(e) => setForm({ ...form, branch_code: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition shadow-sm"
            >
              Add Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBranchModal;
