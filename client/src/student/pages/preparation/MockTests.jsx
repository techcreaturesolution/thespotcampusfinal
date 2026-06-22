import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiClock, FiTarget, FiPlay, FiSearch } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const MockTests = () => {
  const navigate = useNavigate();
  const [mockTests, setMockTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchMockTests(); }, [filter]);

  const fetchMockTests = async () => {
    try {
      const params = filter ? `?test_type=${filter}` : "";
      const { data } = await customFetch.get(`/preparation/mock-tests/active${params}`);
      setMockTests(data.mockTests);
    } catch { toast.error("Failed to load mock tests"); }
    finally { setLoading(false); }
  };

  const handleStart = async (id) => {
    try {
      const { data } = await customFetch.post(`/preparation/mock-tests/${id}/start`);
      navigate(`/dashboard/student/preparation/take-test/${data.attempt._id}`, {
        state: {
          questions: data.questions,
          attempt: data.attempt,
          mockTestId: id,
          remainingSeconds: data.remaining_seconds
        }
      });
    } catch (err) { toast.error(err?.response?.data?.msg || "Failed to start test"); }
  };

  const filtered = mockTests.filter(mt => mt.title.toLowerCase().includes(search.toLowerCase()));
  const types = ["company", "subject", "mixed"];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        icon={FiTarget}
        title="Mock Tests"
        subtitle="Simulate real placement rounds under timed conditions"
        badge={`${mockTests.length} tests`}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("")}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border ${
              !filter
                ? "vibrant-btn text-white border-transparent shadow-sm"
                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350"
            }`}
          >
            All
          </button>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border capitalize ${
                filter === t
                  ? "vibrant-btn text-white border-transparent shadow-sm"
                  : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] sm:ml-auto">
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

      {/* Mock Tests Grid */}
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
                <span className="bg-indigo-50 border border-indigo-100 text-[#3730a3] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                  {mt.test_type}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                {mt.description || `${mt.test_type} mock test simulation.`}
              </p>
            </div>
            
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap gap-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                  <FiTarget className="w-3.5 h-3.5 text-indigo-550" /> {mt.total_questions} Questions
                </span>
                <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                  <FiClock className="w-3.5 h-3.5 text-indigo-550" /> {mt.duration_minutes} Minutes
                </span>
                {mt.negative_marking && (
                  <span className="bg-rose-50 border border-rose-100 text-rose-600 px-2.5 py-1 rounded-lg">
                    -ve marking
                  </span>
                )}
              </div>
              
              <button
                onClick={() => handleStart(mt._id)}
                className="w-full flex items-center justify-center gap-2 vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-full transition-all duration-200 active:scale-95 text-xs shadow-md"
              >
                <FiPlay className="w-4 h-4" /> Start Test
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center space-y-3">
          <FiTarget className="w-12 h-12 text-slate-350" />
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">No Active Mock Tests</h4>
            <p className="text-xs text-slate-450 mt-1">There are no mock tests available right now.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTests;
