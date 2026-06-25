import React, { useState, useEffect } from "react";
import { FiX, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import customFetch from "../../utils/customFetch";

const CreateCategoryModal = ({ isOpen, onClose, onCategoryCreated }) => {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const { data } = await customFetch.get("/preparation/subjects/categories");
      setCategories(data.categories);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

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
      fetchCategories();
      if (onCategoryCreated) onCategoryCreated();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Error adding category");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (catId, catName) => {
    if (!confirm(`Are you sure you want to delete the category "${catName}"?`)) return;
    try {
      await customFetch.delete(`/preparation/subjects/categories/${catId}`);
      toast.success("Category deleted successfully");
      fetchCategories();
      if (onCategoryCreated) onCategoryCreated();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to delete category");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-scale-in text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo_TSC.webp" alt="The Spot Campus" className="h-6 object-contain" />
            <span className="text-slate-355">|</span>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              Manage Categories
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-55 hover:text-slate-700 text-slate-400 transition-all duration-200">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Add Category Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Category Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. general, history, science"
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200 bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="submit"
                  className="vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md hover:opacity-95 text-[10px] uppercase tracking-wider whitespace-nowrap"
                  disabled={loading || !name.trim()}
                >
                  {loading ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Existing Categories
            </label>
            {categories.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-semibold italic">No categories created yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl pl-3 pr-1.5 py-1.5 transition duration-150 group"
                  >
                    <span className="text-xs font-bold text-slate-750 capitalize truncate max-w-[120px]" title={cat.name}>
                      {cat.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat._id, cat.name)}
                      className="w-7 h-7 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-full transition shadow-xs active:scale-95 flex items-center justify-center shrink-0 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Delete Category"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-100 shrink-0 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-white hover:bg-slate-55 text-slate-700 font-extrabold py-2.5 px-6 rounded-xl border border-slate-200 transition-all duration-200 text-[10px] uppercase tracking-wider active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryModal;
