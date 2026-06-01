import React from "react";
import { FiActivity } from "react-icons/fi";

const Hero = ({ label, title, subtitle, statusText, action }) => (
  <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-primary-50 via-white to-indigo-50/40 p-6 sm:p-8 shadow-sm">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="min-w-0">
        {label && (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">{label}</p>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-lg">{subtitle}</p>}
      </div>
      {statusText && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 shrink-0">
          <FiActivity className="w-5 h-5 text-emerald-600" />
          <span className="font-medium">{statusText}</span>
        </div>
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  </div>
);

export default Hero;
