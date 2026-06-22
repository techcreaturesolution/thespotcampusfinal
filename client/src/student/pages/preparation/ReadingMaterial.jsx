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
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  useEffect(() => {
    fetchPdfs();
  }, [filter]);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const { data } = await customFetch.get("/preparation/bookmarks?item_type=pdf");
      setBookmarkedIds(new Set(data.bookmarks.map(bm => bm.item_id)));
    } catch (err) {
      console.error("Failed to load bookmarks", err);
    }
  };

  const fetchPdfs = async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set("category", filter);
      const { data } = await customFetch.get(`/preparation/pdfs/active?${params}`);
      setPdfs(data.pdfs);
    } catch {
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (pdfId) => {
    try {
      const { data } = await customFetch.post("/preparation/bookmarks/toggle", {
        item_type: "pdf",
        item_id: pdfId,
      });
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (data.bookmarked) {
          next.add(pdfId);
        } else {
          next.delete(pdfId);
        }
        return next;
      });
      toast.success(data.msg || "Bookmark toggled successfully");
    } catch {
      toast.error("Failed to bookmark material");
    }
  };

  const handleOpen = async (pdf) => {
    try {
      await customFetch.post("/preparation/pdfs/reading-progress", {
        pdf_id: pdf._id,
        last_page: 1,
        total_pages: pdf.total_pages || 1,
      });
    } catch {}
    window.open(pdf.file_url, "_blank");
  };

  const getDownloadUrl = (url) => {
    if (!url) return "";
    if (url.includes("cloudinary.com")) {
      return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
  };

  const filtered = pdfs.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        title="Reading Material"
        subtitle="Access and bookmark comprehensive PDFs and study notes"
      />

      {/* Categories Tabs & Search bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
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
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border capitalize ${
                filter === c
                  ? "vibrant-btn text-white border-transparent shadow-sm"
                  : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350"
              }`}
            >
              {c.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative w-full lg:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 placeholder-slate-400 focus:border-[#3730a3] focus:ring-1 focus:ring-[#3730a3] outline-none shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Grid of Materials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((pdf) => (
          <div
            key={pdf._id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FiFileText className="text-rose-500 w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate leading-snug" title={pdf.title}>
                    {pdf.title}
                  </h4>
                  <p className="text-xs text-slate-450 mt-1 line-clamp-2 leading-relaxed">
                    {pdf.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Tag badges */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                <span className="px-2.5 py-0.5 bg-[#2563eb]/5 text-[#2563eb] border border-[#2563eb]/10 rounded-full text-[9px] font-black uppercase tracking-wider capitalize">
                  {pdf.category?.replace("_", " ")}
                </span>
                {pdf.total_pages > 0 && (
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-650 rounded-full text-[9px] font-black uppercase tracking-wider">
                    {pdf.total_pages} Pages
                  </span>
                )}
                {pdf.subject_id?.name && (
                  <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                    {pdf.subject_id.name}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleOpen(pdf)}
                className="vibrant-btn flex-1 flex items-center justify-center gap-1.5 text-white py-2.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                <FiExternalLink className="w-3.5 h-3.5" /> Read Note
              </button>

              <button
                onClick={() => handleBookmark(pdf._id)}
                title={bookmarkedIds.has(pdf._id) ? "Remove Bookmark" : "Bookmark Material"}
                className={`w-9 h-9 rounded-full border transition-colors flex items-center justify-center shadow-sm flex-shrink-0 ${
                  bookmarkedIds.has(pdf._id)
                    ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300"
                    : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <FiBookmark className={`w-4 h-4 ${bookmarkedIds.has(pdf._id) ? "fill-current" : "fill-none"}`} />
              </button>

              <a
                href={getDownloadUrl(pdf.file_url)}
                download={`${pdf.title.replace(/\s+/g, "_")}.pdf`}
                target="_blank"
                rel="noreferrer"
                title="Download PDF"
                className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-500 shadow-sm flex-shrink-0"
              >
                <FiDownload className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium">No reading materials found matching your filter/search.</p>
        </div>
      )}
    </div>
  );
};

export default ReadingMaterial;

