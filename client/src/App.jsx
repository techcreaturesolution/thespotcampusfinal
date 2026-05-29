import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";

// Common pages
import Landing from "./common/pages/Landing";
import SignIn from "./common/pages/SignIn";
import DashboardLayout from "./common/pages/DashboardLayout";
import Dashboard from "./common/pages/Dashboard";
import Profile from "./common/pages/Profile";
import VideoInterview from "./common/pages/VideoInterview";
import ErrorPage from "./common/pages/ErrorPage";

// Admin pages
import SignInAdmin from "./admin/pages/SignInAdmin";
import ManageUniversity from "./admin/pages/ManageUniversity";
import ManageCollege from "./admin/pages/ManageCollege";
import ManageCompany from "./admin/pages/ManageCompany";
import ManageStudent from "./admin/pages/ManageStudent";
import ManageTpo from "./admin/pages/ManageTpo";
import ManageRecruitmentPlans from "./admin/pages/ManageRecruitmentPlans";
import ContactList from "./admin/pages/ContactList";

// Student pages
import SignUpStudent from "./student/pages/SignUpStudent";
import OpeningList from "./student/pages/OpeningList";
import ApplyList from "./student/pages/ApplyList";
import ExamPaper from "./student/pages/ExamPaper";
import ExamResult from "./student/pages/ExamResult";
import StudentInterviews from "./student/pages/StudentInterviews";

// Company pages
import SignUpCompany from "./company/pages/SignUpCompany";
import ManageJob from "./company/pages/ManageJob";
import CreateJob from "./company/pages/CreateJob";
import CreateExam from "./company/pages/CreateExam";
import CreateExamFromJD from "./company/pages/CreateExamFromJD";
import CompanyInterviews from "./company/pages/CompanyInterviews";
import RecruitmentSubscription from "./company/pages/RecruitmentSubscription";
import RoundManagement from "./company/pages/RoundManagement";

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
      { path: "round-management/:jobId", element: <RoundManagement /> },
      { path: "video-interview/:roomId", element: <VideoInterview /> },
      { path: "manage-recruitment-plans", element: <ManageRecruitmentPlans /> },
      { path: "recruitment-subscription", element: <RecruitmentSubscription /> },
      { path: "my-interviews", element: <StudentInterviews /> },
      { path: "company-interviews", element: <CompanyInterviews /> },
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
