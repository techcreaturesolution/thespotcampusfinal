import React, { useState } from "react";
import { FiRotateCw } from "react-icons/fi";

const RefreshButton = ({ className = "" }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 850); // A bit longer delay so the user can enjoy the micro-interactions and animations
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={refreshing}
      className={`relative px-3.5 py-2.5 rounded-xl border transition-all duration-300 focus:outline-none flex items-center justify-center gap-2 shadow-sm flex-shrink-0 group font-bold text-xs uppercase tracking-wider
        ${refreshing 
          ? "bg-gradient-to-r from-[#3730a3] to-[#2563eb] text-white border-transparent scale-95 ring-4 ring-indigo-500/20" 
          : "bg-white text-[#3730a3] border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 hover:scale-102 active:scale-95"
        } ${className}`}
      title="Refresh Page"
    >
      {/* Ripple ring pulse animation visible during refresh */}
      {refreshing && (
        <span className="absolute inset-0 rounded-xl bg-indigo-500/30 animate-ping pointer-events-none" />
      )}
      
      <FiRotateCw 
        className={`w-3.5 h-3.5 transition-all duration-500 
          ${refreshing 
            ? "animate-spin scale-110" 
            : "group-hover:rotate-180"
          }`} 
      />
      <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
    </button>
  );
};

export default RefreshButton;
