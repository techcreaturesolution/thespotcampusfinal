import React, { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import Loading from "./common/components/Loading";
import RoleGuard from "./common/components/RoleGuard";

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
const AccountDeletionRequest = lazy(() => import("./common/pages/AccountDeletionRequest"));
const PrivacyPolicy = lazy(() => import("./common/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./common/pages/TermsOfService"));
const ForgotPassword = lazy(() => import("./common/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./common/pages/ResetPassword"));
const ViewPdf = lazy(() => import("./common/pages/ViewPdf"));

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
const AdminManageSubjects = lazy(() => import("./admin/pages/preparation/ManageSubjects"));
const AdminManageQuestions = lazy(() => import("./admin/pages/preparation/ManageQuestions"));
const AdminManageMockTests = lazy(() => import("./admin/pages/preparation/ManageMockTests"));
const AdminManagePdfs = lazy(() => import("./admin/pages/preparation/ManagePdfs"));

// Student Pages
const StudentJobFinder = lazy(() => import("./student/pages/JobFinder"));
const StudentOpeningList = lazy(() => import("./student/pages/OpeningList"));
const StudentApplyList = lazy(() => import("./student/pages/ApplyList"));
const StudentExamPaper = lazy(() => import("./student/pages/ExamPaper"));
const StudentExamResult = lazy(() => import("./student/pages/ExamResult"));
const StudentInterviews = lazy(() => import("./student/pages/StudentInterviews"));
const Plans = lazy(() => import("./student/pages/Plans"));
const StudentResumeBuilder = lazy(() => import("./student/pages/ResumeBuilder"));
const PreparationDashboard = lazy(() => import("./student/pages/preparation/PreparationDashboard"));
const PreviousYearPapers = lazy(() => import("./student/pages/preparation/PreviousYearPapers"));
const MockTests = lazy(() => import("./student/pages/preparation/MockTests"));
const TakeTest = lazy(() => import("./student/pages/preparation/TakeTest"));
const TestResult = lazy(() => import("./student/pages/preparation/TestResult"));
const SubjectPractice = lazy(() => import("./student/pages/preparation/SubjectPractice"));
const PracticeSession = lazy(() => import("./student/pages/preparation/PracticeSession"));
const ReadingMaterial = lazy(() => import("./student/pages/preparation/ReadingMaterial"));
const DailyChallenge = lazy(() => import("./student/pages/preparation/DailyChallenge"));
const PerformanceDashboard = lazy(() => import("./student/pages/preparation/PerformanceDashboard"));
const Bookmarks = lazy(() => import("./student/pages/preparation/Bookmarks"));

// Company Pages
const CompanyManageJob = lazy(() => import("./company/pages/ManageJob"));
const CompanyInterviews = lazy(() => import("./company/pages/CompanyInterviews"));
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
    path: "/account-deletion-request",
    element: <AccountDeletionRequest />,
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/terms-of-service",
    element: <TermsOfService />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />,
  },
  {
    path: "/view-pdf",
    element: <ViewPdf />,
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: null },

      // Shared Video Interview
      { path: "video-interview/:roomId", element: <RoleGuard><VideoInterview /></RoleGuard> },

      // Shared Exam Results
      { path: "exam-result/:id", element: <RoleGuard allowedRoles={["Admin", "Student", "Company"]}><StudentExamResult /></RoleGuard> },
      { path: "company/exam-result/:id", element: <RoleGuard allowedRoles={["Admin", "Company"]}><StudentExamResult /></RoleGuard> },

      // Admin Pages
      { path: "admin/manage-university", element: <RoleGuard allowedRoles={["Admin"]}><AdminManageUniversity /></RoleGuard> },
      { path: "admin/manage-college", element: <RoleGuard allowedRoles={["Admin"]}><AdminManageCollege /></RoleGuard> },
      { path: "admin/manage-company", element: <RoleGuard allowedRoles={["Admin"]}><AdminManageCompany /></RoleGuard> },
      { path: "admin/manage-student", element: <RoleGuard allowedRoles={["Admin"]}><AdminManageStudent /></RoleGuard> },
      { path: "admin/manage-tpo", element: <RoleGuard allowedRoles={["Admin"]}><AdminManageTpo /></RoleGuard> },
      { path: "admin/manage-recruitment-plans", element: <RoleGuard allowedRoles={["Admin"]}><AdminManageRecruitmentPlans /></RoleGuard> },
      { path: "admin/preparation/subjects", element: <RoleGuard allowedRoles={["Admin"]}><AdminManageSubjects /></RoleGuard> },
      { path: "admin/preparation/questions", element: <RoleGuard allowedRoles={["Admin"]}><AdminManageQuestions /></RoleGuard> },
      { path: "admin/preparation/mock-tests", element: <RoleGuard allowedRoles={["Admin"]}><AdminManageMockTests /></RoleGuard> },
      { path: "admin/preparation/pdfs", element: <RoleGuard allowedRoles={["Admin"]}><AdminManagePdfs /></RoleGuard> },
      { path: "admin/contact-list", element: <RoleGuard allowedRoles={["Admin"]}><AdminContactList /></RoleGuard> },
      { path: "admin/manage-cv-templates", element: <RoleGuard allowedRoles={["Admin"]}><AdminManageCvTemplates /></RoleGuard> },
      { path: "admin/reports", element: <RoleGuard allowedRoles={["Admin"]}><AdminReport /></RoleGuard> },
      { path: "admin/transactions", element: <RoleGuard allowedRoles={["Admin"]}><AdminAllTransactions /></RoleGuard> },
      { path: "admin/profile", element: <RoleGuard allowedRoles={["Admin"]}><Profile /></RoleGuard> },

      // Student Pages
      { path: "student/job-finder", element: <RoleGuard allowedRoles={["Student"]}><StudentJobFinder /></RoleGuard> },
      { path: "student/opening-list", element: <RoleGuard allowedRoles={["Student"]}><StudentOpeningList /></RoleGuard> },
      { path: "student/apply-list", element: <RoleGuard allowedRoles={["Student"]}><StudentApplyList /></RoleGuard> },
      { path: "student/exam-paper/:id", element: <RoleGuard allowedRoles={["Student"]}><StudentExamPaper /></RoleGuard> },
      { path: "student/exam-result/:id", element: <RoleGuard allowedRoles={["Student"]}><StudentExamResult /></RoleGuard> },
      { path: "student/my-interviews", element: <RoleGuard allowedRoles={["Student"]}><StudentInterviews /></RoleGuard> },
      { path: "student/profile", element: <RoleGuard allowedRoles={["Student"]}><Profile /></RoleGuard> },
      { path: "student/plans", element: <RoleGuard allowedRoles={["Student"]}><Plans /></RoleGuard> },
      { path: "student/ai-cv-builder", element: <RoleGuard allowedRoles={["Student"]}><StudentResumeBuilder /></RoleGuard> },
      { path: "student/preparation", element: <RoleGuard allowedRoles={["Student"]}><PreparationDashboard /></RoleGuard> },
      { path: "student/preparation/previous-papers", element: <RoleGuard allowedRoles={["Student"]}><PreviousYearPapers /></RoleGuard> },
      { path: "student/preparation/mock-tests", element: <RoleGuard allowedRoles={["Student"]}><MockTests /></RoleGuard> },
      { path: "student/preparation/take-test/:attemptId", element: <RoleGuard allowedRoles={["Student"]}><TakeTest /></RoleGuard> },
      { path: "student/preparation/test-result/:attemptId", element: <RoleGuard allowedRoles={["Student"]}><TestResult /></RoleGuard> },
      { path: "student/preparation/subjects", element: <RoleGuard allowedRoles={["Student"]}><SubjectPractice /></RoleGuard> },
      { path: "student/preparation/practice/:subjectId", element: <RoleGuard allowedRoles={["Student"]}><PracticeSession /></RoleGuard> },
      { path: "student/preparation/reading-material", element: <RoleGuard allowedRoles={["Student"]}><ReadingMaterial /></RoleGuard> },
      { path: "student/preparation/daily-challenge", element: <RoleGuard allowedRoles={["Student"]}><DailyChallenge /></RoleGuard> },
      { path: "student/preparation/performance", element: <RoleGuard allowedRoles={["Student"]}><PerformanceDashboard /></RoleGuard> },
      { path: "student/preparation/bookmarks", element: <RoleGuard allowedRoles={["Student"]}><Bookmarks /></RoleGuard> },

      // Company Pages
      { path: "company/manage-job", element: <RoleGuard allowedRoles={["Company"]}><CompanyManageJob /></RoleGuard> },
      { path: "company/round-management/:jobId", element: <RoleGuard allowedRoles={["Company"]}><CompanyRoundManagement /></RoleGuard> },
      { path: "company/applicants", element: <RoleGuard allowedRoles={["Company"]}><CompanyApplicants /></RoleGuard> },
      { path: "company/company-interviews", element: <RoleGuard allowedRoles={["Company"]}><CompanyInterviews /></RoleGuard> },
      { path: "company/profile", element: <RoleGuard allowedRoles={["Company"]}><Profile /></RoleGuard> },

      // College Pages
      { path: "college/manage-job", element: <RoleGuard allowedRoles={["College"]}><CollegeManageJob /></RoleGuard> },
      { path: "college/manage-student", element: <RoleGuard allowedRoles={["College"]}><CollegeManageStudent /></RoleGuard> },
      { path: "college/manage-degree", element: <RoleGuard allowedRoles={["College"]}><CollegeManageDegree /></RoleGuard> },
      { path: "college/manage-branch", element: <RoleGuard allowedRoles={["College"]}><CollegeManageBranch /></RoleGuard> },
      { path: "college/manage-tpo", element: <RoleGuard allowedRoles={["College"]}><CollegeManageTpo /></RoleGuard> },
      { path: "college/applications", element: <RoleGuard allowedRoles={["College"]}><CollegeApplications /></RoleGuard> },
      { path: "college/profile", element: <RoleGuard allowedRoles={["College"]}><Profile /></RoleGuard> },

      // University Pages
      { path: "university/manage-college", element: <RoleGuard allowedRoles={["University"]}><UniversityManageCollege /></RoleGuard> },
      { path: "university/manage-job", element: <RoleGuard allowedRoles={["University"]}><UniversityManageJob /></RoleGuard> },
      { path: "university/manage-student", element: <RoleGuard allowedRoles={["University"]}><UniversityManageStudent /></RoleGuard> },
      { path: "university/manage-degree", element: <RoleGuard allowedRoles={["University"]}><UniversityManageDegree /></RoleGuard> },
      { path: "university/profile", element: <RoleGuard allowedRoles={["University"]}><Profile /></RoleGuard> },

      // TPO Pages
      { path: "tpo/manage-job", element: <RoleGuard allowedRoles={["TPO"]}><TpoManageJob /></RoleGuard> },
      { path: "tpo/manage-student", element: <RoleGuard allowedRoles={["TPO"]}><TpoManageStudent /></RoleGuard> },
      { path: "tpo/applications", element: <RoleGuard allowedRoles={["TPO"]}><TpoApplications /></RoleGuard> },
      { path: "tpo/profile", element: <RoleGuard allowedRoles={["TPO"]}><Profile /></RoleGuard> },
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
