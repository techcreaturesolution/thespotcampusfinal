import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiUpload } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ subject_id: "", topic_id: "", difficulty: "", search: "", is_previous_year: "" });
  const [form, setForm] = useState({
    subject_id: "", topic_id: "", question_text: "", options: [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }],
    correct_option_index: 0, explanation: "", difficulty: "medium", company_name: "", year: "", is_previous_year: false, tags: "",
  });

  useEffect(() => { fetchSubjects(); }, []);
  useEffect(() => { fetchQuestions(); }, [page, filters]);

  const fetchSubjects = async () => {
    try { const { data } = await customFetch.get("/preparation/subjects"); setSubjects(data.subjects); } catch {}
  };

  const fetchTopics = async (subjectId) => {
    if (!subjectId) { setTopics([]); return; }
    try { const { data } = await customFetch.get(`/preparation/topics/subject/${subjectId}`); setTopics(data.topics); } catch {}
  };

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await customFetch.get(`/preparation/questions?${params}`);
      setQuestions(data.questions); setTotal(data.total);
    } catch { toast.error("Failed to load questions"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [], year: form.year ? Number(form.year) : null };
    payload.options[form.correct_option_index].is_correct = true;
    payload.options.forEach((o, i) => { o.is_correct = i === form.correct_option_index; });
    try {
      if (editing) {
        await customFetch.patch(`/preparation/questions/${editing._id}`, payload);
        toast.success("Question updated");
      } else {
        await customFetch.post("/preparation/questions", payload);
        toast.success("Question created");
      }
      resetForm(); fetchQuestions();
    } catch (err) { toast.error(err?.response?.data?.msg || "Error saving question"); }
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setForm({ subject_id: "", topic_id: "", question_text: "", options: [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }], correct_option_index: 0, explanation: "", difficulty: "medium", company_name: "", year: "", is_previous_year: false, tags: "" });
  };

  const handleEdit = (q) => {
    setEditing(q);
    setForm({
      subject_id: q.subject_id?._id || q.subject_id, topic_id: q.topic_id?._id || q.topic_id,
      question_text: q.question_text, options: q.options.length > 0 ? q.options : [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }],
      correct_option_index: q.correct_option_index, explanation: q.explanation || "", difficulty: q.difficulty,
      company_name: q.company_name || "", year: q.year || "", is_previous_year: q.is_previous_year || false, tags: q.tags?.join(", ") || "",
    });
    fetchTopics(q.subject_id?._id || q.subject_id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this question?")) return;
    try { await customFetch.delete(`/preparation/questions/${id}`); toast.success("Deleted"); fetchQuestions(); } catch { toast.error("Failed"); }
  };

  const totalPages = Math.ceil(total / 15);

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Manage Questions" subtitle={`Total: ${total} questions`} />
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <select value={filters.subject_id} onChange={(e) => { setFilters({ ...filters, subject_id: e.target.value, topic_id: "" }); fetchTopics(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select value={filters.topic_id} onChange={(e) => { setFilters({ ...filters, topic_id: e.target.value }); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">All Topics</option>
          {topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <select value={filters.difficulty} onChange={(e) => { setFilters({ ...filters, difficulty: e.target.value }); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <div className="relative flex-1 min-w-[150px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search..." value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"><FiPlus /> Add Question</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">{editing ? "Edit Question" : "Add Question"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={form.subject_id} onChange={(e) => { setForm({ ...form, subject_id: e.target.value }); fetchTopics(e.target.value); }} required
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <select value={form.topic_id} onChange={(e) => setForm({ ...form, topic_id: e.target.value })} required
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Select Topic</option>
                {topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <textarea placeholder="Question Text" value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} required rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Options (select correct answer):</p>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input type="radio" name="correct" checked={form.correct_option_index === i} onChange={() => setForm({ ...form, correct_option_index: i })} />
                  <input type="text" placeholder={`Option ${i + 1}`} value={opt.text}
                    onChange={(e) => { const opts = [...form.options]; opts[i] = { ...opts[i], text: e.target.value }; setForm({ ...form, options: opts }); }}
                    required className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              ))}
            </div>
            <textarea placeholder="Explanation (optional)" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Company Name (optional)" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input type="number" placeholder="Year (optional)" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_previous_year} onChange={(e) => setForm({ ...form, is_previous_year: e.target.checked })} />
                Previous Year Question
              </label>
            </div>
            <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <div className="flex gap-3">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 text-sm">{editing ? "Update" : "Create"}</button>
              <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Question</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Subject/Topic</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Difficulty</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Company</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {questions.map(q => (
              <tr key={q._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 max-w-[300px] truncate">{q.question_text}</td>
                <td className="px-4 py-3 text-xs">
                  <span className="text-indigo-600">{q.subject_id?.name || "-"}</span> / <span className="text-gray-500">{q.topic_id?.name || "-"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.difficulty === "easy" ? "bg-green-50 text-green-700" : q.difficulty === "hard" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>{q.difficulty}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{q.company_name || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(q)} className="text-blue-600 hover:text-blue-800 mr-2"><FiEdit size={14} /></button>
                  <button onClick={() => handleDelete(q._id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {questions.length === 0 && <p className="text-center text-gray-500 py-8">No questions found</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
            <button key={i + 1} onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded text-sm ${page === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageQuestions;
