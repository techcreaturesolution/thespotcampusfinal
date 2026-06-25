import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiHelpCircle, FiUpload } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";
import CreateQuestionModal from "../../components/CreateQuestionModal";
import BulkUploadModal from "../../components/BulkUploadModal";

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ subject_id: "", difficulty: "", company_name: "", search: "", is_previous_year: "" });
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => { fetchSubjects(); }, []);
  useEffect(() => { fetchQuestions(); }, [page, filters]);
  useEffect(() => { setSelectedIds([]); }, [questions]);

  const fetchSubjects = async () => {
    try { const { data } = await customFetch.get("/preparation/subjects"); setSubjects(data.subjects); } catch {}
  };

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await customFetch.get(`/preparation/questions?${params}`);
      setQuestions(data.questions);
      setTotal(data.total);
      setCompanies(data.companies || []);
    } catch { toast.error("Failed to load questions"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (questionPayload) => {
    try {
      if (editing) {
        await customFetch.patch(`/preparation/questions/${editing._id}`, questionPayload);
        toast.success("Question updated");
      } else {
        await customFetch.post("/preparation/questions", questionPayload);
        toast.success("Question created");
      }
      resetForm(); fetchQuestions();
    } catch (err) { toast.error(err?.response?.data?.msg || "Error saving question"); }
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null);
  };

  const handleEdit = (q) => {
    setEditing(q);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this question?")) return;
    try { await customFetch.delete(`/preparation/questions/${id}`); toast.success("Deleted"); fetchQuestions(); } catch { toast.error("Failed"); }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(questions.map(q => q._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the selected ${selectedIds.length} questions?`)) return;
    try {
      await customFetch.post("/preparation/questions/bulk-delete", { ids: selectedIds });
      toast.success("Selected questions deleted successfully");
      setSelectedIds([]);
      fetchQuestions();
    } catch {
      toast.error("Failed to delete questions");
    }
  };

  const totalPages = Math.ceil(total / 15);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        icon={FiHelpCircle}
        title="Manage Questions"
        subtitle="Create and manage preparation question bank"
        action={
          <div className="flex flex-wrap gap-2.5">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold py-2.5 px-5 rounded-full transition-all duration-200 active:scale-95 inline-flex items-center gap-2 text-xs shadow-sm hover:shadow-md animate-fade-in"
              >
                <FiTrash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => setShowBulkModal(true)}
              className="bg-white hover:bg-slate-55 border border-slate-200 text-slate-700 font-extrabold py-2.5 px-5 rounded-full transition-all duration-200 active:scale-95 inline-flex items-center gap-2 text-xs shadow-sm hover:shadow-md"
            >
              <FiUpload className="w-4 h-4" /> Bulk Import
            </button>
            <button
              onClick={() => { setShowForm(true); setEditing(null); }}
              className="vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-full transition-all duration-200 active:scale-95 inline-flex items-center gap-2 text-xs shadow-md"
            >
              <FiPlus className="w-4 h-4" /> Add Question
            </button>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-4 items-center bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
        <select
          value={filters.subject_id}
          onChange={(e) => { setFilters({ ...filters, subject_id: e.target.value }); setPage(1); }}
          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 outline-none transition-colors cursor-pointer"
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        
        <select
          value={filters.difficulty}
          onChange={(e) => { setFilters({ ...filters, difficulty: e.target.value }); setPage(1); }}
          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 outline-none transition-colors cursor-pointer"
        >
          <option value="">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={filters.company_name}
          onChange={(e) => { setFilters({ ...filters, company_name: e.target.value }); setPage(1); }}
          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 outline-none transition-colors cursor-pointer"
        >
          <option value="">All Companies</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={filters.search}
            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 placeholder-slate-400 focus:border-[#3730a3] focus:ring-1 focus:ring-[#3730a3] outline-none shadow-sm transition-all"
          />
        </div>
      </div>


      {/* Question Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === questions.length && questions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-355 text-indigo-650 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">Question Text</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4 text-center">Difficulty</th>
                <th className="px-6 py-4">Company Context</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.map(q => (
                <tr key={q._id} className={`hover:bg-slate-50/50 transition duration-150 ${selectedIds.includes(q._id) ? "bg-indigo-50/20" : ""}`}>
                  <td className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(q._id)}
                      onChange={() => handleSelectRow(q._id)}
                      className="rounded border-slate-355 text-indigo-650 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 max-w-[320px] truncate font-semibold text-slate-800">
                    {q.question_text}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#3730a3]">
                    {q.subject_id?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                      q.difficulty === "easy"
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                        : q.difficulty === "hard"
                        ? "bg-rose-50 border-rose-100 text-rose-700"
                        : "bg-amber-50 border-amber-100 text-amber-700"
                    }`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-500">
                    {q.company_name ? (
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[9px] uppercase font-black border border-slate-200">
                        {q.company_name} {q.year ? `'${String(q.year).slice(-2)}` : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(q)}
                        className="w-8 h-8 bg-white hover:bg-indigo-50 border border-slate-200 text-[#3730a3] rounded-full transition shadow-xs active:scale-95 flex items-center justify-center"
                        title="Edit Question"
                      >
                        <FiEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="w-8 h-8 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-full transition shadow-xs active:scale-95 flex items-center justify-center"
                        title="Delete Question"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {questions.length === 0 && (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
            <FiHelpCircle className="w-12 h-12 text-slate-350" />
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">No Questions Found</h4>
              <p className="text-xs text-slate-450 mt-1">Try resetting filters or add a new question to start.</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-6">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-full text-xs font-black transition-all active:scale-95 flex items-center justify-center ${
                page === i + 1
                  ? "vibrant-btn text-white shadow-md border-transparent"
                  : "bg-white border border-slate-200 text-slate-650 hover:bg-slate-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <CreateQuestionModal
        isOpen={showForm}
        onClose={resetForm}
        question={editing}
        subjects={subjects}
        onSubmit={handleSubmit}
      />

      <BulkUploadModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        subjects={subjects}
        onUploadSuccess={() => {
          setPage(1);
          fetchQuestions();
        }}
      />
    </div>
  );
};

export default ManageQuestions;
