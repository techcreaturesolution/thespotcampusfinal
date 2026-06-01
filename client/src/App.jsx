
import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";

// Common / base components
import Landing from "./common/pages/Landing";
import SignIn from "./common/pages/SignIn";
import DashboardLayout from "./common/pages/DashboardLayout";
import VideoInterview from "./common/pages/VideoInterview";
import ErrorPage from "./common/pages/ErrorPage";
import SignUpStudent from "./common/pages/SignUpStudent";
import SignUpCompany from "./common/pages/SignUpCompany";
import SignUpUniversity from "./common/pages/SignUpUniversity";
import SignUpCollege from "./common/pages/SignUpCollege";
import Profile from "./common/pages/Profile";

// Admin Pages
import AdminManageUniversity from "./admin/pages/ManageUniversity";
import AdminManageCollege from "./admin/pages/ManageCollege";
import AdminManageCompany from "./admin/pages/ManageCompany";
import AdminManageStudent from "./admin/pages/ManageStudent";
import AdminManageTpo from "./admin/pages/ManageTpo";
import AdminManageRecruitmentPlans from "./admin/pages/ManageRecruitmentPlans";
import AdminContactList from "./admin/pages/ContactList";

// Student Pages
import StudentOpeningList from "./student/pages/OpeningList";
import StudentApplyList from "./student/pages/ApplyList";
import StudentExamPaper from "./student/pages/ExamPaper";
import StudentExamResult from "./student/pages/ExamResult";
import StudentInterviews from "./student/pages/StudentInterviews";
import Plans from "./student/pages/Plans";

// Company Pages
import CompanyManageJob from "./company/pages/ManageJob";
import CompanyInterviews from "./company/pages/CompanyInterviews";
import CompanyRecruitmentSubscription from "./company/pages/RecruitmentSubscription";
import CompanyRoundManagement from "./company/pages/RoundManagement";

// College Pages
import CollegeManageJob from "./college/pages/ManageJob";
import CollegeManageStudent from "./college/pages/ManageStudent";
import CollegeManageDegree from "./college/pages/ManageDegree";
import CollegeManageBranch from "./college/pages/ManageBranch";
import CollegeManageTpo from "./college/pages/ManageTpo";

// University Pages
import UniversityManageJob from "./university/pages/ManageJob";
import UniversityManageStudent from "./university/pages/ManageStudent";
import UniversityManageDegree from "./university/pages/ManageDegree";
import UniversityManageBranch from "./university/pages/ManageBranch";

// TPO Pages
import TpoManageJob from "./tpo/pages/ManageJob";
import TpoManageStudent from "./tpo/pages/ManageStudent";
import TpoManageDegree from "./tpo/pages/ManageDegree";
import TpoManageBranch from "./tpo/pages/ManageBranch";

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
    path: "/sign-up-student",
    element: <SignUpStudent />,
  },
  {
    path: "/sign-up-company",
    element: <SignUpCompany />,
  },
  {
    path: "/sign-up-university",
    element: <SignUpUniversity />,
  },
  {
    path: "/sign-up-college",
    element: <SignUpCollege />,
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: null },

      // Shared Video Interview
      { path: "video-interview/:roomId", element: <VideoInterview /> },

      // Admin Pages
      { path: "admin/manage-university", element: <AdminManageUniversity /> },
      { path: "admin/manage-college", element: <AdminManageCollege /> },
      { path: "admin/manage-company", element: <AdminManageCompany /> },
      { path: "admin/manage-student", element: <AdminManageStudent /> },
      { path: "admin/manage-tpo", element: <AdminManageTpo /> },
      { path: "admin/manage-recruitment-plans", element: <AdminManageRecruitmentPlans /> },
      { path: "admin/contact-list", element: <AdminContactList /> },
      { path: "admin/profile", element: <Profile /> },

      // Student Pages
      { path: "student/opening-list", element: <StudentOpeningList /> },
      { path: "student/apply-list", element: <StudentApplyList /> },
      { path: "student/exam-paper/:id", element: <StudentExamPaper /> },
      { path: "student/exam-result/:id", element: <StudentExamResult /> },
      { path: "student/my-interviews", element: <StudentInterviews /> },
      { path: "student/profile", element: <Profile /> },
      { path: "student/plans", element: <Plans /> },

      // Company Pages
      { path: "company/manage-job", element: <CompanyManageJob /> },
      { path: "company/round-management/:jobId", element: <CompanyRoundManagement /> },
      { path: "company/company-interviews", element: <CompanyInterviews /> },
      { path: "company/recruitment-subscription", element: <CompanyRecruitmentSubscription /> },
      { path: "company/profile", element: <Profile /> },

      // College Pages
      { path: "college/manage-job", element: <CollegeManageJob /> },
      { path: "college/manage-student", element: <CollegeManageStudent /> },
      { path: "college/manage-degree", element: <CollegeManageDegree /> },
      { path: "college/manage-branch", element: <CollegeManageBranch /> },
      { path: "college/manage-tpo", element: <CollegeManageTpo /> },
      { path: "college/profile", element: <Profile /> },

      // University Pages
      { path: "university/manage-job", element: <UniversityManageJob /> },
      { path: "university/manage-student", element: <UniversityManageStudent /> },
      { path: "university/manage-degree", element: <UniversityManageDegree /> },
      { path: "university/manage-branch", element: <UniversityManageBranch /> },
      { path: "university/profile", element: <Profile /> },

      // TPO Pages
      { path: "tpo/manage-job", element: <TpoManageJob /> },
      { path: "tpo/manage-student", element: <TpoManageStudent /> },
      { path: "tpo/manage-degree", element: <TpoManageDegree /> },
      { path: "tpo/manage-branch", element: <TpoManageBranch /> },
      { path: "tpo/profile", element: <Profile /> },
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
