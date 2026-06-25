import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiBook, FiSearch } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";
import CreateSubjectModal from "../../components/CreateSubjectModal";
import CreateCategoryModal from "../../components/CreateCategoryModal";

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    try {
      const { data } = await customFetch.get("/preparation/subjects");
      setSubjects(data.subjects);
    } catch { toast.error("Failed to load subjects"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (subjectData) => {
    try {
      if (editing) {
        await customFetch.patch(`/preparation/subjects/${editing._id}`, subjectData);
        toast.success("Subject updated");
      } else {
        await customFetch.post("/preparation/subjects", subjectData);
        toast.success("Subject created");
      }
      setShowForm(false);
      setEditing(null);
      fetchSubjects();
    } catch (err) { toast.error(err?.response?.data?.msg || "Error saving subject"); }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this subject and all its topics/questions?")) return;
    try { await customFetch.delete(`/preparation/subjects/${id}`); toast.success("Deleted"); fetchSubjects(); }
    catch { toast.error("Failed to delete"); }
  };

  const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        icon={FiBook}
        title="Manage Subjects"
        subtitle="Create and manage preparation subjects"
        badge={`${subjects.length} subjects`}
        action={
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold py-2.5 px-5 rounded-full transition-all duration-200 active:scale-95 inline-flex items-center gap-2 text-xs shadow-sm hover:shadow-md"
            >
              <FiPlus className="w-4 h-4" /> Add Category
            </button>
            <button
              onClick={() => { setShowForm(true); setEditing(null); }}
              className="vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-full transition-all duration-200 active:scale-95 inline-flex items-center gap-2 text-xs shadow-md"
            >
              <FiPlus className="w-4 h-4" /> Add Subject
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-full text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(s => (
          <div
            key={s._id}
            className="bg-white border border-slate-200 rounded-3xl p-5 hover:shadow-md transition-all duration-350 flex flex-col justify-between hover:-translate-y-1 group relative"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#3730a3]">
                    <FiBook className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug group-hover:text-[#3730a3] transition-colors">
                      {s.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Order: {s.sort_order || 0}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleEdit(s)}
                    className="w-8 h-8 bg-white hover:bg-indigo-50 border border-slate-200 text-[#3730a3] rounded-full transition shadow-sm active:scale-95 flex items-center justify-center"
                    title="Edit Subject"
                  >
                    <FiEdit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="w-8 h-8 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-full transition shadow-sm active:scale-95 flex items-center justify-center"
                    title="Delete Subject"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                {s.description || "No description provided."}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
              <span className="bg-indigo-50 border border-indigo-100 text-[#3730a3] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                {s.category}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                s.is_active
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-rose-50 border-rose-100 text-rose-700"
              }`}>
                {s.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center space-y-3">
          <FiBook className="w-12 h-12 text-slate-350" />
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">No Subjects Found</h4>
            <p className="text-xs text-slate-450 mt-1">Create your first subject using the button above.</p>
          </div>
        </div>
      )}

      <CreateSubjectModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        subject={editing}
        onSubmit={handleSubmit}
        nextSortOrder={subjects.length > 0 ? Math.max(...subjects.map(s => s.sort_order || 0)) + 1 : 1}
      />

      <CreateCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoryCreated={() => {
          // Categories will automatically fetch fresh list when CreateSubjectModal opens
        }}
      />
    </div>
  );
};

export default ManageSubjects;
