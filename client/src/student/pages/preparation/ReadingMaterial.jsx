import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiFileText, FiSearch, FiDownload, FiBookmark, FiExternalLink } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const ReadingMaterial = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchPdfs();
    fetchBookmarks();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await customFetch.get("/preparation/subjects/categories");
      setCategories(data.categories.map((c) => c.name));
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

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
      const { data } = await customFetch.get("/preparation/pdfs/active");
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

  // Group uncategorized pdfs (PDFs whose category is empty or not in the categories array)
  const uncategorizedPdfs = filtered.filter(p => {
    if (!p.category) return true;
    return !categories.some(c => c.toLowerCase() === p.category.toLowerCase());
  });

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        title="Reading Material"
        subtitle="Access and bookmark comprehensive PDFs and study notes"
      />

      {/* Search bar */}
      <div className="flex justify-end">
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

      {/* Grid of Category Cards */}
      <div className="space-y-8">
        {categories.map((c) => {
          const categoryPdfs = filtered.filter(p => p.category?.toLowerCase() === c.toLowerCase());
          if (categoryPdfs.length === 0) return null;

          return (
            <div key={c} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              {/* Category Header */}
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 capitalize tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3730a3]"></span>
                  {c.replace("_", " ")}
                </h3>
                <span className="bg-indigo-50 text-[#3730a3] border border-indigo-100 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {categoryPdfs.length} {categoryPdfs.length === 1 ? "File" : "Files"}
                </span>
              </div>

              {/* Grid of PDFs under this category */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryPdfs.map((pdf) => (
                  <div
                    key={pdf._id}
                    className="bg-white rounded-2xl border border-slate-150 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiFileText className="text-rose-500 w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-xs truncate leading-snug" title={pdf.title}>
                            {pdf.title}
                          </h4>
                          <p className="text-[11px] text-slate-450 mt-1 line-clamp-2 leading-relaxed">
                            {pdf.description || "No description provided."}
                          </p>
                        </div>
                      </div>

                      {/* Tag badges */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {pdf.total_pages > 0 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded-full text-[9px] font-black uppercase tracking-wider">
                            {pdf.total_pages} Pages
                          </span>
                        )}
                        {pdf.subject_id?.name && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                            {pdf.subject_id.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleOpen(pdf)}
                        className="vibrant-btn flex-1 flex items-center justify-center gap-1.5 text-white py-2 rounded-full text-[10px] font-bold shadow-md hover:shadow transition-all"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" /> Read
                      </button>

                      <button
                        onClick={() => handleBookmark(pdf._id)}
                        title={bookmarkedIds.has(pdf._id) ? "Remove Bookmark" : "Bookmark Material"}
                        className={`w-8 h-8 rounded-full border transition-colors flex items-center justify-center shadow-sm flex-shrink-0 ${
                          bookmarkedIds.has(pdf._id)
                            ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300"
                            : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <FiBookmark className={`w-3.5 h-3.5 ${bookmarkedIds.has(pdf._id) ? "fill-current" : "fill-none"}`} />
                      </button>

                      <a
                        href={getDownloadUrl(pdf.file_url)}
                        download={`${pdf.title.replace(/\s+/g, "_")}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        title="Download PDF"
                        className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-500 shadow-sm flex-shrink-0"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Uncategorized / Others Category Card */}
        {uncategorizedPdfs.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            {/* Category Header */}
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 capitalize tracking-wide flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                Others
              </h3>
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                {uncategorizedPdfs.length} {uncategorizedPdfs.length === 1 ? "File" : "Files"}
              </span>
            </div>

            {/* Grid of PDFs under Others category */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uncategorizedPdfs.map((pdf) => (
                <div
                  key={pdf._id}
                  className="bg-white rounded-2xl border border-slate-150 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiFileText className="text-rose-500 w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs truncate leading-snug" title={pdf.title}>
                          {pdf.title}
                        </h4>
                        <p className="text-[11px] text-slate-450 mt-1 line-clamp-2 leading-relaxed">
                          {pdf.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    {/* Tag badges */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {pdf.total_pages > 0 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded-full text-[9px] font-black uppercase tracking-wider">
                          {pdf.total_pages} Pages
                        </span>
                      )}
                      {pdf.subject_id?.name && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                          {pdf.subject_id.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => handleOpen(pdf)}
                      className="vibrant-btn flex-1 flex items-center justify-center gap-1.5 text-white py-2 rounded-full text-[10px] font-bold shadow-sm hover:shadow transition-all"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" /> Read
                    </button>

                    <button
                      onClick={() => handleBookmark(pdf._id)}
                      title={bookmarkedIds.has(pdf._id) ? "Remove Bookmark" : "Bookmark Material"}
                      className={`w-8 h-8 rounded-full border transition-colors flex items-center justify-center shadow-sm flex-shrink-0 ${
                        bookmarkedIds.has(pdf._id)
                          ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300"
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <FiBookmark className={`w-3.5 h-3.5 ${bookmarkedIds.has(pdf._id) ? "fill-current" : "fill-none"}`} />
                    </button>

                    <a
                      href={getDownloadUrl(pdf.file_url)}
                      download={`${pdf.title.replace(/\s+/g, "_")}.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      title="Download PDF"
                      className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-55 transition-colors flex items-center justify-center text-slate-500 shadow-sm flex-shrink-0"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium">No reading materials found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default ReadingMaterial;

