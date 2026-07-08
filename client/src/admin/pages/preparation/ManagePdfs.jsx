import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFile } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";
import UploadPdfModal from "../../components/UploadPdfModal";

const ManagePdfs = () => {
  const [pdfs, setPdfs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchPdfs(); fetchSubjects(); }, []);

  const fetchPdfs = async () => {
    try { const { data } = await customFetch.get("/preparation/pdfs"); setPdfs(data.pdfs); }
    catch { toast.error("Failed to load PDFs"); }
    finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try { const { data } = await customFetch.get("/preparation/subjects"); setSubjects(data.subjects); } catch {}
  };

  const handleSubmit = async (formDataState, fileState) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.entries(formDataState).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          formData.append(k, v);
        }
      });
      if (fileState) {
        formData.append("file", fileState);
      }

      if (editing) {
        await customFetch.patch(`/preparation/pdfs/${editing._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("PDF updated");
      } else {
        await customFetch.post("/preparation/pdfs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("PDF uploaded");
      }
      resetForm(); fetchPdfs();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Error saving PDF");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null);
  };

  const handleEdit = (p) => {
    setEditing(p);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this PDF?")) return;
    try { await customFetch.delete(`/preparation/pdfs/${id}`); toast.success("Deleted"); fetchPdfs(); } catch { toast.error("Failed"); }
  };

  const filtered = pdfs.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        icon={FiFile}
        title="Manage PDFs"
        subtitle="Upload and manage study materials"
        badge={`${pdfs.length} files`}
        action={
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-full transition-all duration-200 active:scale-95 inline-flex items-center gap-2 text-xs shadow-md"
          >
            <FiPlus className="w-4 h-4" /> Upload PDF
          </button>
        }
      />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search PDFs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-full text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => (
          <div
            key={p._id}
            className="bg-white border border-slate-200 rounded-3xl p-5 hover:shadow-md transition-all duration-350 flex flex-col justify-between hover:-translate-y-1 group relative"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-550 flex-shrink-0">
                    <FiFile className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug truncate group-hover:text-[#3730a3] transition-colors">
                      {p.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {p.total_pages || "—"} Pages
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleEdit(p)}
                    className="w-8 h-8 bg-white hover:bg-indigo-50 border border-slate-200 text-[#3730a3] rounded-full transition shadow-sm active:scale-95 flex items-center justify-center"
                    title="Edit PDF"
                  >
                    <FiEdit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="w-8 h-8 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-full transition shadow-sm active:scale-95 flex items-center justify-center"
                    title="Delete PDF"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                {p.description || "No description provided."}
              </p>
            </div>
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wider">
                <span className="bg-indigo-50 border border-indigo-100 text-[#3730a3] px-2 py-0.5 rounded-md">
                  {p.category?.replace("_", " ")}
                </span>
                {p.subject_id?.name && (
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                    {p.subject_id.name}
                  </span>
                )}
                <span className="bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md">
                  {p.view_count || 0} views
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center space-y-3">
          <FiFile className="w-12 h-12 text-slate-350" />
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">No PDFs Found</h4>
            <p className="text-xs text-slate-450 mt-1">Upload your first study material PDF using the button above.</p>
          </div>
        </div>
      )}

      <UploadPdfModal
        isOpen={showForm}
        onClose={resetForm}
        pdf={editing}
        subjects={subjects}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </div>
  );
};

export default ManagePdfs;
