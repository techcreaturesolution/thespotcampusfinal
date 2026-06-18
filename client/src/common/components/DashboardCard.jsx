import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

const DashboardCard = ({
  value,
  label,
  description,
  icon: Icon,
  iconBg = "bg-primary-100 text-primary-600",
  path,
  actionText,
  state,
}) => {
  const cardContent = (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-indigo-50/20 border-l-4 border-l-[#3730a3] p-3.5 shadow-sm hover:shadow-md hover:shadow-indigo-100/40 hover:-translate-y-0.5 hover:border-indigo-300/80 transition-all duration-300 group h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/90 shadow-sm border border-slate-100 transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-100">
            {Icon && <Icon className={`w-4.5 h-4.5 ${iconBg.split(" ").find(c => c.startsWith("text-")) || "text-[#3730a3]"}`} />}
          </div>
          {path && !description && (
            <FiArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#3730a3] group-hover:translate-x-0.5 transition-all" />
          )}
        </div>

        {/* Render big stat value if present */}
        {value !== undefined && (
          <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{value}</p>
        )}

        {/* Render label */}
        <h3 className="font-bold uppercase tracking-wider text-[9px] text-slate-500 mt-1">
          {label}
        </h3>

        {/* Render description if present (Student style) */}
        {description && (
          <p className="text-slate-500 text-[11px] mt-1 leading-normal">{description}</p>
        )}
      </div>

      {/* Render student style bottom arrow action text */}
      {description && actionText && (
        <span className="text-[11px] font-bold text-[#3730a3] group-hover:text-[#2563eb] mt-3 inline-flex items-center gap-1">
          {actionText}
        </span>
      )}
    </div>
  );

  if (path) {
    return (
      <Link to={path} state={state} className="block h-full cursor-pointer">
        {cardContent}
      </Link>
    );
  }

  return <div className="h-full">{cardContent}</div>;
};

export default DashboardCard;
