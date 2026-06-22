import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiClock, FiSearch, FiTarget } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";
import CreateMockTestModal from "../../components/CreateMockTestModal";

const ManageMockTests = () => {
  const [mockTests, setMockTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchMockTests(); fetchSubjects(); }, []);

  const fetchMockTests = async () => {
    try { const { data } = await customFetch.get("/preparation/mock-tests"); setMockTests(data.mockTests); }
    catch { toast.error("Failed to load mock tests"); }
    finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try { const { data } = await customFetch.get("/preparation/subjects"); setSubjects(data.subjects); } catch {}
  };

  const handleSubmit = async (mockTestData) => {
    try {
      if (editing) {
        await customFetch.patch(`/preparation/mock-tests/${editing._id}`, mockTestData);
        toast.success("Mock test updated");
      } else {
        await customFetch.post("/preparation/mock-tests", mockTestData);
        toast.success("Mock test created");
      }
      resetForm(); fetchMockTests();
    } catch (err) { toast.error(err?.response?.data?.msg || "Error saving mock test"); }
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null);
  };

  const handleEdit = (mt) => {
    setEditing(mt);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this mock test?")) return;
    try { await customFetch.delete(`/preparation/mock-tests/${id}`); toast.success("Deleted"); fetchMockTests(); } catch { toast.error("Failed"); }
  };

  const filtered = mockTests.filter(mt => mt.title.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        icon={FiTarget}
        title="Manage Mock Tests"
        subtitle="Create and configure test structures"
        badge={`${mockTests.length} tests`}
        action={
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-full transition-all duration-200 active:scale-95 inline-flex items-center gap-2 text-xs shadow-md"
          >
            <FiPlus className="w-4 h-4" /> Add Mock Test
          </button>
        }
      />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search mock tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-full text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(mt => (
          <div
            key={mt._id}
            className="bg-white border border-slate-200 rounded-3xl p-5 hover:shadow-md transition-all duration-350 flex flex-col justify-between hover:-translate-y-1 group relative"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#3730a3]">
                    <FiTarget className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug group-hover:text-[#3730a3] transition-colors">
                      {mt.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {mt.difficulty} Difficulty
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleEdit(mt)}
                    className="w-8 h-8 bg-white hover:bg-indigo-50 border border-slate-200 text-[#3730a3] rounded-full transition shadow-sm active:scale-95 flex items-center justify-center"
                    title="Edit Test"
                  >
                    <FiEdit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(mt._id)}
                    className="w-8 h-8 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-full transition shadow-sm active:scale-95 flex items-center justify-center"
                    title="Delete Test"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                {mt.description || "No description provided."}
              </p>
            </div>
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  <FiClock className="w-3 h-3 text-indigo-550" /> {mt.duration_minutes}m
                </span>
                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  Questions: {mt.total_questions}
                </span>
                {mt.negative_marking && (
                  <span className="bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-md">
                    -ve marking
                  </span>
                )}
                <span className="bg-indigo-50 border border-indigo-100 text-[#3730a3] px-2 py-0.5 rounded-md">
                  {mt.attempts_count} attempts
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center space-y-3">
          <FiTarget className="w-12 h-12 text-slate-350" />
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">No Mock Tests Found</h4>
            <p className="text-xs text-slate-450 mt-1">Create your first mock test using the button above.</p>
          </div>
        </div>
      )}

      <CreateMockTestModal
        isOpen={showForm}
        onClose={resetForm}
        mockTest={editing}
        subjects={subjects}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ManageMockTests;
