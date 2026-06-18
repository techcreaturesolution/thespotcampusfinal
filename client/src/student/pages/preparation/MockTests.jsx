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
      navigate(`/dashboard/student/preparation/take-test/${data.attempt._id}`, { state: { questions: data.questions, attempt: data.attempt, mockTestId: id } });
    } catch (err) { toast.error(err?.response?.data?.msg || "Failed to start test"); }
  };

  const filtered = mockTests.filter(mt => mt.title.toLowerCase().includes(search.toLowerCase()));
  const types = ["company", "subject", "topic", "mixed"];
  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Mock Tests" subtitle="Simulate real placement rounds" />

      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => setFilter("")} className={`px-4 py-2 rounded-lg text-sm transition ${!filter ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>All</button>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-lg text-sm transition capitalize ${filter === t ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{t}</button>
        ))}
        <div className="relative flex-1 min-w-[150px] ml-auto">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(mt => (
          <div key={mt._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">{mt.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{mt.description || `${mt.test_type} mock test`}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${mt.test_type === "company" ? "bg-blue-50 text-blue-700" : mt.test_type === "subject" ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{mt.test_type}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><FiTarget size={12} />{mt.total_questions} Q</span>
              <span className="flex items-center gap-1"><FiClock size={12} />{mt.duration_minutes} min</span>
              {mt.negative_marking && <span className="text-red-500">-ve marking</span>}
              <span className={`px-2 py-0.5 rounded ${mt.difficulty === "easy" ? "bg-green-50 text-green-700" : mt.difficulty === "hard" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>{mt.difficulty}</span>
            </div>
            <button onClick={() => handleStart(mt._id)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition text-sm">
              <FiPlay size={14} /> Start Test
            </button>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No mock tests available</p>}
    </div>
  );
};

export default MockTests;
