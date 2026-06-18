import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiBook, FiSearch } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const CATEGORIES = ["aptitude", "reasoning", "english", "programming", "technical", "general"];

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", description: "", category: "technical", icon: "", sort_order: 0 });

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    try {
      const { data } = await customFetch.get("/preparation/subjects");
      setSubjects(data.subjects);
    } catch { toast.error("Failed to load subjects"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await customFetch.patch(`/preparation/subjects/${editing._id}`, form);
        toast.success("Subject updated");
      } else {
        await customFetch.post("/preparation/subjects", form);
        toast.success("Subject created");
      }
      setShowForm(false); setEditing(null);
      setForm({ name: "", description: "", category: "technical", icon: "", sort_order: 0 });
      fetchSubjects();
    } catch (err) { toast.error(err?.response?.data?.msg || "Error saving subject"); }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description, category: s.category, icon: s.icon, sort_order: s.sort_order });
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
    <div>
      <PageHeader title="Manage Subjects" subtitle="Create and manage preparation subjects" />
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search subjects..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", description: "", category: "technical", icon: "", sort_order: 0 }); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          <FiPlus /> Add Subject
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">{editing ? "Edit Subject" : "Add Subject"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Subject Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 md:col-span-2" />
            <input type="number" placeholder="Sort Order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            <div className="flex gap-3">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                {editing ? "Update" : "Create"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <FiBook className="text-indigo-600" />
                <h4 className="font-bold text-gray-800">{s.name}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(s)} className="text-blue-600 hover:text-blue-800"><FiEdit size={16} /></button>
                <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={16} /></button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-2">{s.description || "No description"}</p>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{s.category}</span>
              {s.is_active ? <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">Active</span>
                : <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">Inactive</span>}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No subjects found</p>}
    </div>
  );
};

export default ManageSubjects;
