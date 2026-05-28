import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";

import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignInAdmin from "./pages/SignInAdmin";
import SignUpStudent from "./pages/SignUpStudent";
import SignUpCompany from "./pages/SignUpCompany";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ManageJob from "./pages/ManageJob";
import CreateJob from "./pages/CreateJob";
import CreateExam from "./pages/CreateExam";
import CreateExamFromJD from "./pages/CreateExamFromJD";
import ExamPaper from "./pages/ExamPaper";
import ExamResult from "./pages/ExamResult";
import ManageCompany from "./pages/ManageCompany";
import ManageStudent from "./pages/ManageStudent";
import ManageCollege from "./pages/ManageCollege";
import ManageUniversity from "./pages/ManageUniversity";
import ManageTpo from "./pages/ManageTpo";
import Profile from "./pages/Profile";
import OpeningList from "./pages/OpeningList";
import ApplyList from "./pages/ApplyList";
import ContactList from "./pages/ContactList";
import ErrorPage from "./pages/ErrorPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/sign-in",
    element: <SignIn />,
  },
  {
    path: "/sign-in-admin",
    element: <SignInAdmin />,
  },
  {
    path: "/sign-up-student",
    element: <SignUpStudent />,
  },
  {
    path: "/sign-up-company",
    element: <SignUpCompany />,
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "manage-job", element: <ManageJob /> },
      { path: "create-job", element: <CreateJob /> },
      { path: "create-exam/:id", element: <CreateExam /> },
      { path: "create-exam-jd/:id", element: <CreateExamFromJD /> },
      { path: "exam-paper/:id", element: <ExamPaper /> },
      { path: "exam-result/:id", element: <ExamResult /> },
      { path: "manage-company", element: <ManageCompany /> },
      { path: "manage-student", element: <ManageStudent /> },
      { path: "manage-college", element: <ManageCollege /> },
      { path: "manage-university", element: <ManageUniversity /> },
      { path: "manage-tpo", element: <ManageTpo /> },
      { path: "opening-list", element: <OpeningList /> },
      { path: "apply-list", element: <ApplyList /> },
      { path: "contact-list", element: <ContactList /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={3000} />
    </QueryClientProvider>
  );
};

export default App;
