import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import customFetch from "../../utils/customFetch";

const CreateCategoryModal = ({ isOpen, onClose, onCategoryCreated }) => {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim() === "") {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);
    try {
      await customFetch.post("/preparation/subjects/categories", { name: name.trim() });
      toast.success("Category added successfully");
      setName("");
      if (onCategoryCreated) onCategoryCreated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Error adding category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-scale-in text-left">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo_TSC.webp" alt="The Spot Campus" className="h-6 object-contain" />
            <span className="text-slate-350">|</span>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              Add Category
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-55 hover:text-slate-700 text-slate-400 transition-all duration-200">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. general, history, science"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-55 text-slate-700 font-extrabold py-2 px-4 rounded-xl border border-slate-200 transition-all duration-200 text-[10px] uppercase tracking-wider"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vibrant-btn text-white font-extrabold py-2 px-4 rounded-xl transition-all duration-200 shadow-md hover:opacity-95 text-[10px] uppercase tracking-wider"
              disabled={loading || !name.trim()}
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCategoryModal;
