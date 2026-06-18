import React from "react";

const variants = {
  danger: "w-8 h-8 rounded-lg bg-red-50 hover:bg-red-500 text-red-600 hover:text-white transition-all duration-150 border border-red-100 flex items-center justify-center shadow-sm",
  success: "w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-all duration-150 border border-emerald-100 flex items-center justify-center shadow-sm",
  neutral: "w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#3730a3] text-slate-500 hover:text-white transition-all duration-150 border border-slate-100 flex items-center justify-center shadow-sm",
  primary: "w-8 h-8 rounded-lg bg-indigo-50 hover:bg-[#3730a3] text-[#3730a3] hover:text-white transition-all duration-150 border border-indigo-100 flex items-center justify-center shadow-sm",
};

const IconButton = ({ onClick, children, variant = "neutral", title, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-0 transition-colors disabled:opacity-40 ${variants[variant] || variants.neutral}`}
  >
    {children}
  </button>
);

export default IconButton;
