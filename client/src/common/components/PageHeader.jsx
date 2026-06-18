import React from "react";
import RefreshButton from "./RefreshButton";

const PageHeader = ({ title, subtitle, icon: Icon, action, badge }) => (
  <div className="mb-6">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3730a3] to-[#2563eb] text-white flex items-center justify-center shadow-md shadow-indigo-500/10 shrink-0">
            <Icon className="w-5.5 h-5.5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            {badge && (
              <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-[#3730a3] uppercase tracking-wider shadow-sm">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-slate-500 mt-1.5 text-xs sm:text-sm max-w-2xl leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <RefreshButton />
        {action}
      </div>
    </div>
  </div>
);

export default PageHeader;
