import React from "react";

const Loading = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
    </div>
    <p className="text-sm font-medium text-slate-700">Loading data…</p>
  </div>
);

export default Loading;
