import React, { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import Loading from "./common/components/Loading";

// Common / base components
const Landing = lazy(() => import("./common/pages/Landing"));
const SignIn = lazy(() => import("./common/pages/SignIn"));
const DashboardLayout = lazy(() => import("./common/pages/DashboardLayout"));
const VideoInterview = lazy(() => import("./common/pages/VideoInterview"));
const ErrorPage = lazy(() => import("./common/pages/ErrorPage"));
const SignUpStudent = lazy(() => import("./common/pages/SignUpStudent"));
const SignUpCompany = lazy(() => import("./common/pages/SignUpCompany"));
const SignUpUniversity = lazy(() => import("./common/pages/SignUpUniversity"));
const SignUpCollege = lazy(() => import("./common/pages/SignUpCollege"));
const Profile = lazy(() => import("./common/pages/Profile"));

// Admin Pages
const AdminManageUniversity = lazy(() => import("./admin/pages/ManageUniversity"));
const AdminManageCollege = lazy(() => import("./admin/pages/ManageCollege"));
const AdminManageCompany = lazy(() => import("./admin/pages/ManageCompany"));
const AdminManageStudent = lazy(() => import("./admin/pages/ManageStudent"));
const AdminManageTpo = lazy(() => import("./admin/pages/ManageTpo"));
const AdminManageRecruitmentPlans = lazy(() => import("./admin/pages/ManageRecruitmentPlans"));
const AdminContactList = lazy(() => import("./admin/pages/ContactList"));
const AdminManageCvTemplates = lazy(() => import("./admin/pages/ManageCvTemplates"));
const AdminReport = lazy(() => import("./admin/pages/AdminReport"));
const AdminAllTransactions = lazy(() => import("./admin/pages/AllTransactions"));

// Student Pages
const StudentOpeningList = lazy(() => import("./student/pages/OpeningList"));
const StudentApplyList = lazy(() => import("./student/pages/ApplyList"));
const StudentExamPaper = lazy(() => import("./student/pages/ExamPaper"));
const StudentExamResult = lazy(() => import("./student/pages/ExamResult"));
const StudentInterviews = lazy(() => import("./student/pages/StudentInterviews"));
const Plans = lazy(() => import("./student/pages/Plans"));
const StudentResumeBuilder = lazy(() => import("./student/pages/ResumeBuilder"));

// Company Pages
const CompanyManageJob = lazy(() => import("./company/pages/ManageJob"));
const CompanyInterviews = lazy(() => import("./company/pages/CompanyInterviews"));
const CompanyRecruitmentSubscription = lazy(() => import("./company/pages/RecruitmentSubscription"));
const CompanyRoundManagement = lazy(() => import("./company/pages/RoundManagement"));
const CompanyApplicants = lazy(() => import("./company/pages/CompanyApplications"));

// College Pages
const CollegeManageJob = lazy(() => import("./college/pages/ManageJob"));
const CollegeManageStudent = lazy(() => import("./college/pages/ManageStudent"));
const CollegeManageDegree = lazy(() => import("./college/pages/ManageDegree"));
const CollegeManageBranch = lazy(() => import("./college/pages/ManageBranch"));
const CollegeManageTpo = lazy(() => import("./college/pages/ManageTpo"));
const CollegeApplications = lazy(() => import("./college/pages/CollegeApplications"));

// University Pages
const UniversityManageJob = lazy(() => import("./university/pages/ManageJob"));
const UniversityManageStudent = lazy(() => import("./university/pages/ManageStudent"));
const UniversityManageDegree = lazy(() => import("./university/pages/ManageDegree"));
const UniversityManageCollege = lazy(() => import("./university/pages/ManageCollege"));

// TPO Pages
const TpoManageJob = lazy(() => import("./tpo/pages/ManageJob"));
const TpoManageStudent = lazy(() => import("./tpo/pages/ManageStudent"));
const TpoApplications = lazy(() => import("./tpo/pages/TpoApplications"));



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

      // Shared Exam Results
      { path: "exam-result/:id", element: <StudentExamResult /> },
      { path: "company/exam-result/:id", element: <StudentExamResult /> },

      // Admin Pages
      { path: "admin/manage-university", element: <AdminManageUniversity /> },
      { path: "admin/manage-college", element: <AdminManageCollege /> },
      { path: "admin/manage-company", element: <AdminManageCompany /> },
      { path: "admin/manage-student", element: <AdminManageStudent /> },
      { path: "admin/manage-tpo", element: <AdminManageTpo /> },
      { path: "admin/manage-recruitment-plans", element: <AdminManageRecruitmentPlans /> },
      { path: "admin/contact-list", element: <AdminContactList /> },
      { path: "admin/manage-cv-templates", element: <AdminManageCvTemplates /> },
      { path: "admin/reports", element: <AdminReport /> },
      { path: "admin/transactions", element: <AdminAllTransactions /> },
      { path: "admin/profile", element: <Profile /> },

      // Student Pages
      { path: "student/opening-list", element: <StudentOpeningList /> },
      { path: "student/apply-list", element: <StudentApplyList /> },
      { path: "student/exam-paper/:id", element: <StudentExamPaper /> },
      { path: "student/exam-result/:id", element: <StudentExamResult /> },
      { path: "student/my-interviews", element: <StudentInterviews /> },
      { path: "student/profile", element: <Profile /> },
      { path: "student/plans", element: <Plans /> },
      { path: "student/ai-cv-builder", element: <StudentResumeBuilder /> },

      // Company Pages
      { path: "company/manage-job", element: <CompanyManageJob /> },
      { path: "company/round-management/:jobId", element: <CompanyRoundManagement /> },
      { path: "company/applicants", element: <CompanyApplicants /> },
      { path: "company/company-interviews", element: <CompanyInterviews /> },
      { path: "company/recruitment-subscription", element: <CompanyRecruitmentSubscription /> },
      { path: "company/profile", element: <Profile /> },

      // College Pages
      { path: "college/manage-job", element: <CollegeManageJob /> },
      { path: "college/manage-student", element: <CollegeManageStudent /> },
      { path: "college/manage-degree", element: <CollegeManageDegree /> },
      { path: "college/manage-branch", element: <CollegeManageBranch /> },
      { path: "college/manage-tpo", element: <CollegeManageTpo /> },
      { path: "college/applications", element: <CollegeApplications /> },
      { path: "college/profile", element: <Profile /> },

      // University Pages
      { path: "university/manage-college", element: <UniversityManageCollege /> },
      { path: "university/manage-job", element: <UniversityManageJob /> },
      { path: "university/manage-student", element: <UniversityManageStudent /> },
      { path: "university/manage-degree", element: <UniversityManageDegree /> },
      { path: "university/profile", element: <Profile /> },

      // TPO Pages
      { path: "tpo/manage-job", element: <TpoManageJob /> },
      { path: "tpo/manage-student", element: <TpoManageStudent /> },
      { path: "tpo/applications", element: <TpoApplications /> },
      { path: "tpo/profile", element: <Profile /> },
    ],
  },
]);

const App = () => {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default App;
