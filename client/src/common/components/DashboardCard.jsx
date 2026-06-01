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
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300 group h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} transition-transform duration-300 group-hover:scale-105`}>
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          {path && !description && (
            <FiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
          )}
        </div>

        {/* Render big stat value if present */}
        {value !== undefined && (
          <p className="text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
        )}

        {/* Render label */}
        <h3 className={`font-bold text-gray-900 ${description ? "text-sm mt-2" : "text-sm mt-0.5 font-medium text-gray-500"}`}>
          {label}
        </h3>

        {/* Render description if present (Student style) */}
        {description && (
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Render student style bottom arrow action text */}
      {description && actionText && (
        <span className="text-xs font-bold text-primary-600 group-hover:text-primary-700 mt-4 inline-flex items-center gap-1">
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
