import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiBookmark, FiTrash2, FiFileText, FiTarget, FiBook, FiPlay, FiExternalLink, FiClock } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const Bookmarks = () => {
  const navigate = useNavigate();
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

  const handleRemove = async (itemId, itemType) => {
    try {
      await customFetch.post("/preparation/bookmarks/toggle", { item_type: itemType, item_id: itemId });
      fetchBookmarks();
      toast.success("Bookmark removed");
    } catch {}
  };

  const handleStartTest = async (id) => {
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
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to start test");
    }
  };

  const handleReadPdf = (pdf) => {
    if (pdf?.file_url) {
      window.open(pdf.file_url, "_blank");
    } else {
      toast.error("PDF URL not available");
    }
  };

  const handleStartPractice = (subject) => {
    if (subject?._id) {
      navigate(`/dashboard/student/preparation/practice/${subject._id}`, { state: { subject } });
    }
  };

  const handleStartPyPaper = (bm) => {
    if (bm.item_id && bm.item) {
      navigate("/dashboard/student/preparation/previous-year", {
        state: {
          year: Number(bm.notes),
          category: bm.item.category,
          subjectId: bm.item_id,
          subjectName: bm.item.name,
        }
      });
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        icon={FiBookmark}
        title="Saved Items"
        subtitle="Your bookmarked questions, tests, and study materials"
        badge={`${bookmarks.length} bookmarks`}
      />

      {/* Filter Tabs */}
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
        <button
          onClick={() => setFilter("question")}
          className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 ${
            filter === "question"
              ? "vibrant-btn text-white border-transparent shadow-sm"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350"
          }`}
        >
          <FiBook size={12} /> Questions
        </button>
        <button
          onClick={() => setFilter("subject")}
          className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 ${
            filter === "subject"
              ? "vibrant-btn text-white border-transparent shadow-sm"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350"
          }`}
        >
          <FiBook size={12} /> Subjects
        </button>
        <button
          onClick={() => setFilter("mock_test")}
          className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 ${
            filter === "mock_test"
              ? "vibrant-btn text-white border-transparent shadow-sm"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350"
          }`}
        >
          <FiTarget size={12} /> Tests
        </button>
        <button
          onClick={() => setFilter("previous_year")}
          className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 ${
            filter === "previous_year"
              ? "vibrant-btn text-white border-transparent shadow-sm"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350"
          }`}
        >
          <FiClock size={12} /> Papers
        </button>
        <button
          onClick={() => setFilter("pdf")}
          className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 ${
            filter === "pdf"
              ? "vibrant-btn text-white border-transparent shadow-sm"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350"
          }`}
        >
          <FiFileText size={12} /> PDFs
        </button>
      </div>

      {/* Bookmarks List */}
      <div className="space-y-3.5">
        {bookmarks.map(bm => (
          <div
            key={bm._id}
            className="bg-white rounded-3xl border border-slate-200 p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:border-slate-300 transition duration-300 group"
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                bm.item_type === "question"
                  ? "bg-blue-50 text-blue-600"
                  : bm.item_type === "mock_test"
                  ? "bg-purple-50 text-purple-600"
                  : bm.item_type === "pdf"
                  ? "bg-rose-50 text-rose-600"
                  : bm.item_type === "subject"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}>
                {bm.item_type === "question" ? (
                  <FiBook className="w-4 h-4" />
                ) : bm.item_type === "mock_test" ? (
                  <FiTarget className="w-4 h-4" />
                ) : bm.item_type === "pdf" ? (
                  <FiFileText className="w-4 h-4" />
                ) : bm.item_type === "subject" ? (
                  <FiBook className="w-4 h-4" />
                ) : (
                  <FiClock className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-slate-800 truncate leading-snug">
                  {bm.item_type === "previous_year"
                    ? `${bm.item?.name || "Unnamed Subject"} - ${bm.notes || ""} Paper`
                    : bm.item?.question_text || bm.item?.title || bm.item?.name || "Unnamed Item"}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-extrabold uppercase mt-1">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                    {bm.item_type === "previous_year" ? "Previous Year Paper" : bm.item_type?.replace("_", " ")}
                  </span>
                  {bm.item?.subject_id?.name && (
                    <span>&middot; {bm.item.subject_id.name}</span>
                  )}
                  {bm.item?.category && (
                    <span>&middot; {bm.item.category}</span>
                  )}
                  {bm.item?.difficulty && (
                    <span className={`px-1.5 py-0.5 rounded border ${
                      bm.item.difficulty === "easy"
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                        : bm.item.difficulty === "hard"
                        ? "bg-rose-50 border-rose-100 text-rose-700"
                        : "bg-amber-50 border-amber-100 text-amber-700"
                    }`}>
                      {bm.item.difficulty}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center flex-shrink-0 ml-4">
              {bm.item_type === "mock_test" && (
                <button
                  onClick={() => handleStartTest(bm.item_id)}
                  className="vibrant-btn flex items-center justify-center gap-1.5 text-white py-1.5 px-4 rounded-full text-xs font-bold shadow-md active:scale-95"
                >
                  <FiPlay className="w-3 h-3" /> Start Test
                </button>
              )}
              {bm.item_type === "pdf" && (
                <button
                  onClick={() => handleReadPdf(bm.item)}
                  className="vibrant-btn flex items-center justify-center gap-1.5 text-white py-1.5 px-4 rounded-full text-xs font-bold shadow-md active:scale-95"
                >
                  <FiExternalLink className="w-3 h-3" /> Read PDF
                </button>
              )}
              {bm.item_type === "subject" && (
                <button
                  onClick={() => handleStartPractice(bm.item)}
                  className="vibrant-btn flex items-center justify-center gap-1.5 text-white py-1.5 px-4 rounded-full text-xs font-bold shadow-md active:scale-95"
                >
                  <FiPlay className="w-3 h-3" /> Practice
                </button>
              )}
              {bm.item_type === "previous_year" && (
                <button
                  onClick={() => handleStartPyPaper(bm)}
                  className="vibrant-btn flex items-center justify-center gap-1.5 text-white py-1.5 px-4 rounded-full text-xs font-bold shadow-md active:scale-95"
                >
                  <FiPlay className="w-3 h-3" /> Start Paper
                </button>
              )}
              <button
                onClick={() => handleRemove(bm.item_id, bm.item_type)}
                className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 flex items-center justify-center transition-colors shadow-sm flex-shrink-0 active:scale-95"
                title="Remove Bookmark"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {bookmarks.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center space-y-3">
          <FiBookmark className="w-12 h-12 text-slate-350" />
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">No Saved Items Found</h4>
            <p className="text-xs text-slate-450 mt-1">Bookmark questions, mock tests, PDFs, subjects, or previous year papers while preparing to view them here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
