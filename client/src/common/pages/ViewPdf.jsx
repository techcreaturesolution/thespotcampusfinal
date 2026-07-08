import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const ViewPdf = () => {
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url");
  const title = searchParams.get("title") || "Study Material";

  useEffect(() => {
    // Force the document title to show the study material name
    document.title = title;
  }, [title]);

  if (!url) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 font-extrabold text-slate-700 text-xs uppercase tracking-wider">
        Invalid PDF URL
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-900">
      <iframe
        src={url}
        className="w-full h-full border-none"
        title={title}
      />
    </div>
  );
};

export default ViewPdf;
