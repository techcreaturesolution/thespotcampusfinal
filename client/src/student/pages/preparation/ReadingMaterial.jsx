import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiFileText, FiSearch, FiDownload, FiBookmark, FiExternalLink } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const CATEGORIES = ["aptitude", "reasoning", "programming", "interview_preparation", "company_specific", "general"];

const ReadingMaterial = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchPdfs(); }, [filter]);

  const fetchPdfs = async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set("category", filter);
      const { data } = await customFetch.get(`/preparation/pdfs/active?${params}`);
      setPdfs(data.pdfs);
    } catch { toast.error("Failed to load materials"); }
    finally { setLoading(false); }
  };

  const handleBookmark = async (pdfId) => {
    try {
      await customFetch.post("/preparation/bookmarks/toggle", { item_type: "pdf", item_id: pdfId });
      toast.success("Bookmark toggled");
    } catch {}
  };

  const handleOpen = async (pdf) => {
    try {
      await customFetch.post("/preparation/pdfs/reading-progress", { pdf_id: pdf._id, last_page: 1, total_pages: pdf.total_pages || 1 });
    } catch {}
    window.open(pdf.file_url, "_blank");
  };

  const filtered = pdfs.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Reading Material" subtitle="Study PDFs for comprehensive preparation" />

      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => setFilter("")} className={`px-3 py-1.5 rounded-lg text-sm transition ${!filter ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-sm transition capitalize ${filter === c ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {c.replace("_", " ")}
          </button>
        ))}
        <div className="relative flex-1 min-w-[150px] ml-auto">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(pdf => (
          <div key={pdf._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiFileText className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-sm truncate">{pdf.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{pdf.description || pdf.category?.replace("_", " ")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3 text-xs">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded capitalize">{pdf.category?.replace("_", " ")}</span>
              {pdf.total_pages > 0 && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{pdf.total_pages} pages</span>}
              {pdf.subject_id?.name && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">{pdf.subject_id.name}</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleOpen(pdf)}
                className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 text-xs">
                <FiExternalLink size={12} /> Read
              </button>
              <button onClick={() => handleBookmark(pdf._id)}
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-yellow-500"><FiBookmark size={14} /></button>
              <a href={pdf.file_url} download target="_blank" rel="noreferrer"
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"><FiDownload size={14} /></a>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No reading materials available</p>}
    </div>
  );
};

export default ReadingMaterial;
