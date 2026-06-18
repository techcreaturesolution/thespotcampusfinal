import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFile, FiDownload, FiEye } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const CATEGORIES = ["aptitude", "reasoning", "programming", "interview_preparation", "company_specific", "general"];

const ManagePdfs = () => {
  const [pdfs, setPdfs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "programming", subject_id: "", tags: "", total_pages: 0, file_url: "" });
  const [file, setFile] = useState(null);

  useEffect(() => { fetchPdfs(); fetchSubjects(); }, []);

  const fetchPdfs = async () => {
    try { const { data } = await customFetch.get("/preparation/pdfs"); setPdfs(data.pdfs); }
    catch { toast.error("Failed to load PDFs"); }
    finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try { const { data } = await customFetch.get("/preparation/subjects"); setSubjects(data.subjects); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
    if (file) formData.append("file", file);
    try {
      if (editing) {
        await customFetch.patch(`/preparation/pdfs/${editing._id}`, form);
        toast.success("PDF updated");
      } else {
        await customFetch.post("/preparation/pdfs", formData, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("PDF uploaded");
      }
      resetForm(); fetchPdfs();
    } catch (err) { toast.error(err?.response?.data?.msg || "Error saving PDF"); }
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null); setFile(null);
    setForm({ title: "", description: "", category: "programming", subject_id: "", tags: "", total_pages: 0, file_url: "" });
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description || "", category: p.category, subject_id: p.subject_id?._id || "", tags: p.tags?.join(", ") || "", total_pages: p.total_pages || 0, file_url: p.file_url || "" });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this PDF?")) return;
    try { await customFetch.delete(`/preparation/pdfs/${id}`); toast.success("Deleted"); fetchPdfs(); } catch { toast.error("Failed"); }
  };

  const filtered = pdfs.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Manage PDFs" subtitle="Upload and manage study materials" />
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search PDFs..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"><FiPlus /> Upload PDF</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">{editing ? "Edit PDF" : "Upload PDF"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>
            <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Select Subject (optional)</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <input type="number" placeholder="Total Pages" value={form.total_pages} onChange={(e) => setForm({ ...form, total_pages: Number(e.target.value) })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            {!editing && (
              <div>
                <label className="text-sm text-gray-600 mb-1 block">PDF File or URL:</label>
                <div className="flex gap-3">
                  <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
                  <input type="text" placeholder="Or enter PDF URL" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 text-sm">{editing ? "Update" : "Upload"}</button>
              <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <FiFile className="text-red-500" />
                <h4 className="font-bold text-gray-800 text-sm">{p.title}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800"><FiEdit size={14} /></button>
                <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={14} /></button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-2">{p.description || "No description"}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">{p.category?.replace("_", " ")}</span>
              {p.total_pages > 0 && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{p.total_pages} pages</span>}
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded flex items-center gap-1"><FiEye size={10} />{p.view_count}</span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded flex items-center gap-1"><FiDownload size={10} />{p.download_count}</span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No PDFs found</p>}
    </div>
  );
};

export default ManagePdfs;
