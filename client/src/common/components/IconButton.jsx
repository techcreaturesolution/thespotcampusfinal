import React from "react";

const variants = {
  danger: "text-red-600 hover:bg-red-50",
  success: "text-emerald-600 hover:bg-emerald-50",
  neutral: "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
  primary: "text-primary-600 hover:bg-primary-50",
};

const IconButton = ({ onClick, children, variant = "neutral", title, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${variants[variant] || variants.neutral}`}
  >
    {children}
  </button>
);

export default IconButton;
