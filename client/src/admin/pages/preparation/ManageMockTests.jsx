import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiClock, FiSearch } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const TEST_TYPES = ["company", "subject", "topic", "mixed"];

const ManageMockTests = () => {
  const [mockTests, setMockTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", test_type: "subject", company_name: "", subject_id: "", topic_id: "",
    total_questions: 20, duration_minutes: 30, negative_marking: false, negative_mark_value: 0.25,
    marks_per_question: 1, passing_percentage: 40, randomize_questions: true, difficulty: "mixed",
  });

  useEffect(() => { fetchMockTests(); fetchSubjects(); }, []);

  const fetchMockTests = async () => {
    try { const { data } = await customFetch.get("/preparation/mock-tests"); setMockTests(data.mockTests); }
    catch { toast.error("Failed to load mock tests"); }
    finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try { const { data } = await customFetch.get("/preparation/subjects"); setSubjects(data.subjects); } catch {}
  };

  const fetchTopics = async (subjectId) => {
    if (!subjectId) { setTopics([]); return; }
    try { const { data } = await customFetch.get(`/preparation/topics/subject/${subjectId}`); setTopics(data.topics); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, subject_id: form.subject_id || undefined, topic_id: form.topic_id || undefined };
    try {
      if (editing) {
        await customFetch.patch(`/preparation/mock-tests/${editing._id}`, payload);
        toast.success("Mock test updated");
      } else {
        await customFetch.post("/preparation/mock-tests", payload);
        toast.success("Mock test created");
      }
      resetForm(); fetchMockTests();
    } catch (err) { toast.error(err?.response?.data?.msg || "Error saving mock test"); }
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setForm({ title: "", description: "", test_type: "subject", company_name: "", subject_id: "", topic_id: "", total_questions: 20, duration_minutes: 30, negative_marking: false, negative_mark_value: 0.25, marks_per_question: 1, passing_percentage: 40, randomize_questions: true, difficulty: "mixed" });
  };

  const handleEdit = (mt) => {
    setEditing(mt);
    setForm({
      title: mt.title, description: mt.description || "", test_type: mt.test_type, company_name: mt.company_name || "",
      subject_id: mt.subject_id?._id || "", topic_id: mt.topic_id?._id || "", total_questions: mt.total_questions,
      duration_minutes: mt.duration_minutes, negative_marking: mt.negative_marking, negative_mark_value: mt.negative_mark_value,
      marks_per_question: mt.marks_per_question, passing_percentage: mt.passing_percentage, randomize_questions: mt.randomize_questions, difficulty: mt.difficulty,
    });
    if (mt.subject_id?._id) fetchTopics(mt.subject_id._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this mock test?")) return;
    try { await customFetch.delete(`/preparation/mock-tests/${id}`); toast.success("Deleted"); fetchMockTests(); } catch { toast.error("Failed"); }
  };

  const filtered = mockTests.filter(mt => mt.title.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Manage Mock Tests" subtitle={`${mockTests.length} mock tests`} />
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search mock tests..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"><FiPlus /> Add Mock Test</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">{editing ? "Edit Mock Test" : "Create Mock Test"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Test Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <select value={form.test_type} onChange={(e) => setForm({ ...form, test_type: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {TEST_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} Mock</option>)}
              </select>
            </div>
            <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            {form.test_type === "company" && (
              <input type="text" placeholder="Company Name (e.g., Google, TCS)" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            )}
            {(form.test_type === "subject" || form.test_type === "topic") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={form.subject_id} onChange={(e) => { setForm({ ...form, subject_id: e.target.value }); fetchTopics(e.target.value); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                {form.test_type === "topic" && (
                  <select value={form.topic_id} onChange={(e) => setForm({ ...form, topic_id: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="">Select Topic</option>
                    {topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="text-xs text-gray-500">Questions</label>
                <input type="number" value={form.total_questions} onChange={(e) => setForm({ ...form, total_questions: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-xs text-gray-500">Duration (min)</label>
                <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-xs text-gray-500">Marks/Question</label>
                <input type="number" value={form.marks_per_question} onChange={(e) => setForm({ ...form, marks_per_question: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="text-xs text-gray-500">Pass %</label>
                <input type="number" value={form.passing_percentage} onChange={(e) => setForm({ ...form, passing_percentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.negative_marking} onChange={(e) => setForm({ ...form, negative_marking: e.target.checked })} /> Negative Marking
              </label>
              {form.negative_marking && (
                <input type="number" step="0.01" value={form.negative_mark_value} onChange={(e) => setForm({ ...form, negative_mark_value: Number(e.target.value) })}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm w-24" placeholder="0.25" />
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.randomize_questions} onChange={(e) => setForm({ ...form, randomize_questions: e.target.checked })} /> Randomize
              </label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="px-3 py-1 border border-gray-200 rounded-lg text-sm">
                <option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 text-sm">{editing ? "Update" : "Create"}</button>
              <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(mt => (
          <div key={mt._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-gray-800 text-sm">{mt.title}</h4>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(mt)} className="text-blue-600 hover:text-blue-800"><FiEdit size={14} /></button>
                <button onClick={() => handleDelete(mt._id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={14} /></button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">{mt.description || "No description"}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-medium">{mt.test_type}</span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded flex items-center gap-1"><FiClock size={10} />{mt.duration_minutes}m</span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{mt.total_questions}Q</span>
              {mt.negative_marking && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded">-ve marking</span>}
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded">{mt.attempts_count} attempts</span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No mock tests found</p>}
    </div>
  );
};

export default ManageMockTests;
