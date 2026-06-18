import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiBookmark, FiTrash2, FiFileText, FiTarget, FiBook } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => { fetchBookmarks(); }, [filter]);

  const fetchBookmarks = async () => {
    try {
      const params = filter ? `?item_type=${filter}` : "";
      const { data } = await customFetch.get(`/preparation/bookmarks${params}`);
      setBookmarks(data.bookmarks);
    } catch { toast.error("Failed to load bookmarks"); }
    finally { setLoading(false); }
  };

  const handleRemove = async (itemId) => {
    try {
      await customFetch.post("/preparation/bookmarks/toggle", { item_type: "question", item_id: itemId });
      fetchBookmarks();
      toast.success("Bookmark removed");
    } catch {}
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Saved Items" subtitle="Your bookmarked questions, tests, and PDFs" />

      <div className="flex gap-3 mb-6">
        <button onClick={() => setFilter("")} className={`px-4 py-2 rounded-lg text-sm ${!filter ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>All</button>
        <button onClick={() => setFilter("question")} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${filter === "question" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}><FiBook size={12} /> Questions</button>
        <button onClick={() => setFilter("mock_test")} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${filter === "mock_test" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}><FiTarget size={12} /> Tests</button>
        <button onClick={() => setFilter("pdf")} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${filter === "pdf" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}><FiFileText size={12} /> PDFs</button>
      </div>

      <div className="space-y-3">
        {bookmarks.map(bm => (
          <div key={bm._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bm.item_type === "question" ? "bg-blue-50" : bm.item_type === "mock_test" ? "bg-purple-50" : "bg-red-50"}`}>
                {bm.item_type === "question" ? <FiBook className="text-blue-600" size={14} /> : bm.item_type === "mock_test" ? <FiTarget className="text-purple-600" size={14} /> : <FiFileText className="text-red-600" size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {bm.item?.question_text || bm.item?.title || "Item"}
                </p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span className="capitalize">{bm.item_type?.replace("_", " ")}</span>
                  {bm.item?.subject_id?.name && <span>&middot; {bm.item.subject_id.name}</span>}
                  {bm.item?.difficulty && <span className={`px-1.5 py-0.5 rounded ${bm.item.difficulty === "easy" ? "bg-green-50 text-green-700" : bm.item.difficulty === "hard" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>{bm.item.difficulty}</span>}
                </div>
              </div>
            </div>
            <button onClick={() => handleRemove(bm.item_id)} className="text-red-400 hover:text-red-600 p-2"><FiTrash2 size={14} /></button>
          </div>
        ))}
      </div>
      {bookmarks.length === 0 && (
        <div className="text-center py-12">
          <FiBookmark className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500">No bookmarks yet</p>
          <p className="text-sm text-gray-400 mt-1">Bookmark questions, tests, or PDFs while practicing</p>
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
