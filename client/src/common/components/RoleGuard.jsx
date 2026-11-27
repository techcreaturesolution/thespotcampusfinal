import React from "react";
import { Navigate } from "react-router-dom";

const VALID_ROLES = ["Admin", "University", "College", "TPO", "Company", "Student"];

const RoleGuard = ({ allowedRoles = VALID_ROLES, userRole, isLoading = false, redirectTo = "/sign-in", children }) => {
  if (isLoading) {
    return null;
  }
  const effectiveRole = userRole ?? localStorage.getItem("role");
  if (!effectiveRole || !VALID_ROLES.includes(effectiveRole)) {
    return <Navigate to={redirectTo} replace />;
  }
  if (!allowedRoles.includes(effectiveRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default RoleGuard;
