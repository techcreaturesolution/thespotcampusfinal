import React from "react";
import { FiActivity } from "react-icons/fi";

const Hero = ({ label, title, subtitle, statusText, action }) => (
  <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-slate-50 to-blue-50/40 p-6 sm:p-8 shadow-sm">
    {/* Subtle light geometric accents inside the card */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/10 rounded-full blur-2xl pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/10 rounded-full blur-2xl pointer-events-none" />
    
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
      <div className="min-w-0">
        {label && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#3730a3] mb-1.5">{label}</p>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title && title.includes("Welcome back") ? (
            <>
              Welcome back, <span className="text-gradient font-black">{title.split("Welcome back, ")[1]}</span>
            </>
          ) : title}
        </h1>
        {subtitle && <p className="text-slate-500 mt-2 text-xs sm:text-sm max-w-lg leading-relaxed">{subtitle}</p>}
      </div>
      {statusText && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100/60 border border-emerald-200/80 rounded-xl px-4 py-2.5 shrink-0 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{statusText}</span>
        </div>
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  </div>
);

export default Hero;
