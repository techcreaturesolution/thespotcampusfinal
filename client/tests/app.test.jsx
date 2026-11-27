import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ErrorBoundary from "../src/common/components/ErrorBoundary.jsx";
import RoleGuard from "../src/common/components/RoleGuard.jsx";

const Boom = () => {
  throw new Error("Simulated render crash");
};

const ALL_ROLES = ["Admin", "University", "College", "TPO", "Company", "Student"];

describe("S0-11 Web Stabilization & RoleGuard Regression Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("ErrorBoundary renders fallback UI when a child throws", () => {
    const spy = console.error;
    console.error = () => {};
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    console.error = spy;
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  it("RoleGuard redirects unauthenticated users to /sign-in", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/reports"]}>
        <Routes>
          <Route
            path="/dashboard/admin/reports"
            element={
              <RoleGuard allowedRoles={["Admin"]}>
                <div>Admin Reports</div>
              </RoleGuard>
            }
          />
          <Route path="/sign-in" element={<div>Sign In Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Sign In Page")).toBeTruthy();
    expect(screen.queryByText("Admin Reports")).toBeNull();
  });

  it("RoleGuard fails closed on unknown/invalid roles", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/student/opening-list"]}>
        <Routes>
          <Route
            path="/dashboard/student/opening-list"
            element={
              <RoleGuard allowedRoles={["Student"]} userRole="SuperHacker">
                <div>Student Openings</div>
              </RoleGuard>
            }
          />
          <Route path="/sign-in" element={<div>Sign In Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Sign In Page")).toBeTruthy();
    expect(screen.queryByText("Student Openings")).toBeNull();
  });

  it("RoleGuard allows each of the 6 roles on its own route and blocks cross-role access", () => {
    for (const role of ALL_ROLES) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[`/${role.toLowerCase()}`]}>
          <Routes>
            <Route
              path={`/${role.toLowerCase()}`}
              element={
                <RoleGuard allowedRoles={[role]} userRole={role}>
                  <div>{`${role} Portal`}</div>
                </RoleGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText(`${role} Portal`)).toBeTruthy();
      unmount();

      const otherRole = role === "Admin" ? "Student" : "Admin";
      const { unmount: unmount2 } = render(
        <MemoryRouter initialEntries={[`/${role.toLowerCase()}`]}>
          <Routes>
            <Route
              path={`/${role.toLowerCase()}`}
              element={
                <RoleGuard allowedRoles={[role]} userRole={otherRole}>
                  <div>{`${role} Portal`}</div>
                </RoleGuard>
              }
            />
            <Route path="/dashboard" element={<div>Dashboard Redirect</div>} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText("Dashboard Redirect")).toBeTruthy();
      expect(screen.queryByText(`${role} Portal`)).toBeNull();
      unmount2();
    }
  });
});
