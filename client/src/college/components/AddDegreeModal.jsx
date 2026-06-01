import React, { useState } from "react";
import { FiX } from "react-icons/fi";

const AddDegreeModal = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    degree_name: "",
    degree_code: "",
    degree_sem: "6",
  });

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New Degree</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Degree Name</label>
            <input
              type="text"
              placeholder="e.g. Bachelor of Computer Applications"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              value={form.degree_name}
              onChange={(e) => setForm({ ...form, degree_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Degree Code</label>
            <input
              type="text"
              placeholder="e.g. BCA"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              value={form.degree_code}
              onChange={(e) => setForm({ ...form, degree_code: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Semesters</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              value={form.degree_sem}
              onChange={(e) => setForm({ ...form, degree_sem: e.target.value })}
              required
              min="1"
              max="12"
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
              Add Degree
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDegreeModal;
