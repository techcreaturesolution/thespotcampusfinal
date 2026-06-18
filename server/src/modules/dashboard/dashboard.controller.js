import tbl_student from "../student/student.model.js";
import tbl_company from "../company/company.model.js";
import tbl_job from "../job/job.model.js";
import tbl_application from "../application/application.model.js";
import tbl_college from "../college/college.model.js";
import tbl_university from "../university/university.model.js";
import tbl_exam from "../exam/exam.model.js";
import tbl_paper from "../exam/paper.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import tbl_interview from "../interview/interview.model.js";
import tbl_branch from "../branch/branch.model.js";
import tbl_degree from "../degree/degree.model.js";
import tbl_contact from "../contact/contact.model.js";
import tbl_payment from "../subscription/payment.model.js";
import { RecruitmentSubscription } from "../subscription/subscription.model.js";
import tbl_exam_payment from "../subscription/exampayment.model.js";
import { StatusCodes } from "http-status-codes";

export const getDashboardStats = async (req, res) => {
  try {
    let studentQuery = {};
    let companyQuery = {};
    let jobQuery = {};
    let applicationQuery = {};
    let collegeQuery = {};
    let universityQuery = {};
    let examQuery = {};
    let paperQuery = {};
    let tpoQuery = {};
    let interviewQuery = {};
    let branchQuery = {};
    let degreeQuery = {};
    let contactQuery = {};

    if (req.user) {
      if (req.user.role === "College") {
        studentQuery.college_id = req.user.userId;
        jobQuery = {
          $or: [
            { "job_college.job_college_id": req.user.userId },
            { approved_colleges: req.user.userId }
          ]
        };
        branchQuery.college_id = req.user.userId;
        tpoQuery.tpo_college_id = req.user.userId;
        degreeQuery.college_id = req.user.userId;

        const students = await tbl_student.find({ college_id: req.user.userId }).select("_id");
        const studentIds = students.map((s) => s._id);
        applicationQuery.student_id = { $in: studentIds };
        
        const jobs = await tbl_job.find(jobQuery).select("job_company_id");
        companyQuery._id = { $in: jobs.map((j) => j.job_company_id).filter(Boolean) };

        const exams = await tbl_exam.find({}).populate("job_id");
        const examIds = exams
          .filter((e) => {
            if (!e.job_id) return false;
            return e.job_id.job_college?.some(jc => jc.job_college_id?.toString() === req.user.userId) ||
                   e.job_id.approved_colleges?.map(id => id.toString()).includes(req.user.userId);
          })
          .map((e) => e._id);
        examQuery._id = { $in: examIds };
        paperQuery.student_id = { $in: studentIds };

        interviewQuery.student_id = { $in: studentIds };
        contactQuery._id = null;
      } else if (req.user.role === "TPO") {
        const tpo = await tbl_tpo.findById(req.user.userId);
        if (tpo) {
          studentQuery.college_id = tpo.tpo_college_id;
          branchQuery.college_id = tpo.tpo_college_id;
          tpoQuery.tpo_college_id = tpo.tpo_college_id;
          degreeQuery.college_id = tpo.tpo_college_id;

          if (tpo.tpo_degree_id) {
            studentQuery.degree_id = tpo.tpo_degree_id;
            branchQuery.degree_id = tpo.tpo_degree_id;
            degreeQuery._id = tpo.tpo_degree_id;

            jobQuery = {
              job_college: {
                $elemMatch: {
                  job_college_id: tpo.tpo_college_id,
                  job_degree_id: tpo.tpo_degree_id,
                }
              }
            };
          } else {
            jobQuery = {
              "job_college.job_college_id": tpo.tpo_college_id,
            };
          }

          const students = await tbl_student.find(studentQuery).select("_id");
          const studentIds = students.map((s) => s._id);
          applicationQuery.student_id = { $in: studentIds };

          const jobs = await tbl_job.find(jobQuery).select("job_company_id");
          companyQuery._id = { $in: jobs.map((j) => j.job_company_id).filter(Boolean) };

          const exams = await tbl_exam.find({}).populate("job_id");
          const examIds = exams
            .filter((e) => {
              if (!e.job_id) return false;
              return e.job_id.job_college?.some(
                (jc) => jc.job_college_id?.toString() === tpo.tpo_college_id?.toString() &&
                        (!tpo.tpo_degree_id || jc.job_degree_id?.toString() === tpo.tpo_degree_id?.toString())
              );
            })
            .map((e) => e._id);
          examQuery._id = { $in: examIds };
          paperQuery.student_id = { $in: studentIds };

          interviewQuery.student_id = { $in: studentIds };
          contactQuery._id = null;
        }
      } else if (req.user.role === "University") {
        const colleges = await tbl_college.find({ college_university_id: req.user.userId }).select("_id");
        const collegeIds = colleges.map((c) => c._id);

        studentQuery.college_id = { $in: collegeIds };
        jobQuery = {
          $or: [
            { "job_college.job_college_id": { $in: collegeIds } },
            { approved_colleges: { $in: collegeIds } }
          ]
        };
        tpoQuery.tpo_college_id = { $in: collegeIds };
        collegeQuery.college_university_id = req.user.userId;
        degreeQuery.college_id = { $in: collegeIds };
        branchQuery.college_id = { $in: collegeIds };

        const students = await tbl_student.find({ college_id: { $in: collegeIds } }).select("_id");
        const studentIds = students.map((s) => s._id);
        applicationQuery.student_id = { $in: studentIds };

        const jobs = await tbl_job.find(jobQuery).select("job_company_id");
        companyQuery._id = { $in: jobs.map((j) => j.job_company_id).filter(Boolean) };

        const exams = await tbl_exam.find({}).populate("job_id");
        const examIds = exams
          .filter((e) => {
            if (!e.job_id) return false;
            return e.job_id.job_college?.some(jc => collegeIds.map(cid => cid.toString()).includes(jc.job_college_id?.toString())) ||
                   e.job_id.approved_colleges?.some((id) => collegeIds.map((cid) => cid.toString()).includes(id.toString()));
          })
          .map((e) => e._id);
        examQuery._id = { $in: examIds };
        paperQuery.student_id = { $in: studentIds };

        interviewQuery.student_id = { $in: studentIds };
        contactQuery._id = null;
      }
    }

    const [
      totalStudents,
      totalCompanies,
      totalJobs,
      totalApplications,
      totalColleges,
      totalUniversities,
      totalExams,
      totalPapers,
      totalTPOs,
      totalInterviews,
      totalBranches,
      totalDegrees,
      totalContacts,
    ] = await Promise.all([
      tbl_student.countDocuments(studentQuery),
      tbl_company.countDocuments(companyQuery),
      tbl_job.countDocuments(jobQuery),
      tbl_application.countDocuments(applicationQuery),
      tbl_college.countDocuments(collegeQuery),
      tbl_university.countDocuments(universityQuery),
      tbl_exam.countDocuments(examQuery),
      tbl_paper.countDocuments(paperQuery),
      tbl_tpo.countDocuments(tpoQuery),
      tbl_interview.countDocuments(interviewQuery),
      tbl_branch.countDocuments(branchQuery),
      tbl_degree.countDocuments(degreeQuery),
      tbl_contact.countDocuments(contactQuery),
    ]);

    const recentJobs = await tbl_job
      .find(jobQuery)
      .populate("job_company_id")
      .sort("-createdAt")
      .limit(5);

    const recentApplications = await tbl_application
      .find(applicationQuery)
      .populate("student_id")
      .populate("job_id")
      .sort("-createdAt")
      .limit(5);

    res.status(StatusCodes.OK).json({
      stats: {
        totalStudents,
        totalCompanies,
        totalJobs,
        totalApplications,
        totalColleges,
        totalUniversities,
        totalExams,
        totalPapers,
        totalTPOs,
        totalInterviews,
        totalBranches,
        totalDegrees,
        totalContacts,
      },
      recentJobs,
      recentApplications,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getAdminReport = async (req, res) => {
  try {
    // 1. Basic counts
    const [
      studentsCount,
      verifiedStudentsCount,
      pendingStudentsCount,
      companiesCount,
      approvedCompaniesCount,
      pendingCompaniesCount,
      rejectedCompaniesCount,
      collegesCount,
      approvedCollegesCount,
      pendingCollegesCount,
      rejectedCollegesCount,
      universitiesCount,
      tposCount,
      jobsCount,
      applicationsCount,
      examsCount,
      papersCount,
      interviewsCount,
      contactsCount,
    ] = await Promise.all([
      tbl_student.countDocuments({}),
      tbl_student.countDocuments({ isVerifiedByTPO: true }),
      tbl_student.countDocuments({ isVerifiedByTPO: false }),
      tbl_company.countDocuments({}),
      tbl_company.countDocuments({ company_verified: "Approved" }),
      tbl_company.countDocuments({ company_verified: { $nin: ["Approved", "Rejected"] } }),
      tbl_company.countDocuments({ company_verified: "Rejected" }),
      tbl_college.countDocuments({}),
      tbl_college.countDocuments({ college_verified: "Approved" }),
      tbl_college.countDocuments({ college_verified: { $nin: ["Approved", "Rejected"] } }),
      tbl_college.countDocuments({ college_verified: "Rejected" }),
      tbl_university.countDocuments({}),
      tbl_tpo.countDocuments({}),
      tbl_job.countDocuments({}),
      tbl_application.countDocuments({}),
      tbl_exam.countDocuments({}),
      tbl_paper.countDocuments({}),
      tbl_interview.countDocuments({}),
      tbl_contact.countDocuments({}),
    ]);

    // 2. Job states
    const [activeJobsCount, closedJobsCount] = await Promise.all([
      tbl_job.countDocuments({ job_status: { $ne: "0" } }),
      tbl_job.countDocuments({ job_status: "0" }),
    ]);

    // 3. Application states
    const [selectedAppsCount, rejectedAppsCount, pendingAppsCount] = await Promise.all([
      tbl_application.countDocuments({ final_result: "selected" }),
      tbl_application.countDocuments({ final_result: "rejected" }),
      tbl_application.countDocuments({ final_result: { $nin: ["selected", "rejected"] } }),
    ]);

    // 4. Financial Calculations & Combined Payment Logs
    // Student subscription payments
    const studentPayments = await tbl_payment.find({ status: "Paid" }).populate("user_id", "student_name student_email");
    const studentRevenue = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Company subscription payments
    const companyPayments = await RecruitmentSubscription.find({ status: "Paid" }).populate("company_id", "company_name company_email").populate("plan_id", "plan_name");
    const companyRevenue = companyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // AI Exam payments
    const examPayments = await tbl_exam_payment.find({ status: "Paid" }).populate("user_id", "company_name company_email");
    const examRevenue = examPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalRevenue = studentRevenue + companyRevenue + examRevenue;

    // Combined recent transactions
    const studentTx = studentPayments.map((p) => ({
      _id: p._id,
      user: p.user_name || p.user_id?.student_name || "Student",
      email: p.user_email || p.user_id?.student_email || "N/A",
      role: "Student",
      type: "Student Plan",
      plan: p.plan_name,
      amount: p.amount,
      createdAt: p.createdAt,
    }));

    const companyTx = companyPayments.map((p) => ({
      _id: p._id,
      user: p.company_id?.company_name || "Company",
      email: p.company_id?.company_email || "N/A",
      role: "Company",
      type: "Recruitment Subscription",
      plan: p.plan_id?.plan_name || "Company Plan",
      amount: p.amount,
      createdAt: p.createdAt,
    }));

    const examTx = examPayments.map((p) => ({
      _id: p._id,
      user: p.user_id?.company_name || "Company",
      email: p.user_id?.company_email || "N/A",
      role: "Company",
      type: "AI Exam Purchase",
      plan: "AI Exam Token",
      amount: p.amount,
      createdAt: p.createdAt,
    }));

    const recentTransactions = [...studentTx, ...companyTx, ...examTx]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // 5. Recent trends / placements
    const recentPlacements = await tbl_application
      .find({ final_result: "selected" })
      .populate("student_id", "student_name student_email college_id")
      .populate({
        path: "job_id",
        populate: {
          path: "job_company_id",
          model: "tbl_company",
          select: "company_name"
        }
      })
      .sort("-updatedAt")
      .limit(10);

    res.status(StatusCodes.OK).json({
      counts: {
        students: studentsCount,
        verifiedStudents: verifiedStudentsCount,
        pendingStudents: pendingStudentsCount,
        companies: companiesCount,
        approvedCompanies: approvedCompaniesCount,
        pendingCompanies: pendingCompaniesCount,
        rejectedCompanies: rejectedCompaniesCount,
        colleges: collegesCount,
        approvedColleges: approvedCollegesCount,
        pendingColleges: pendingCollegesCount,
        rejectedColleges: rejectedCollegesCount,
        universities: universitiesCount,
        tpos: tposCount,
        jobs: jobsCount,
        applications: applicationsCount,
        exams: examsCount,
        papers: papersCount,
        interviews: interviewsCount,
        contacts: contactsCount,
      },
      jobs: {
        active: activeJobsCount,
        closed: closedJobsCount,
      },
      applications: {
        selected: selectedAppsCount,
        rejected: rejectedAppsCount,
        pending: pendingAppsCount,
      },
      financials: {
        studentRevenue,
        companyRevenue,
        examRevenue,
        totalRevenue,
        studentPaymentsCount: studentPayments.length,
        companyPaymentsCount: companyPayments.length,
        examPaymentsCount: examPayments.length,
      },
      recentTransactions,
      recentPlacements,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const [studentPayments, companyPayments, examPayments] = await Promise.all([
      tbl_payment.find({ status: "Paid" }).populate("user_id", "student_name student_email"),
      RecruitmentSubscription.find({ status: "Paid" }).populate("company_id", "company_name company_email").populate("plan_id", "plan_name"),
      tbl_exam_payment.find({ status: "Paid" }).populate("user_id", "company_name company_email"),
    ]);

    const studentTx = studentPayments.map((p) => ({
      _id: p._id,
      user: p.user_name || p.user_id?.student_name || "Student",
      email: p.user_email || p.user_id?.student_email || "N/A",
      role: "Student",
      type: "Student Plan",
      plan: p.plan_name,
      amount: p.amount,
      createdAt: p.createdAt,
    }));

    const companyTx = companyPayments.map((p) => ({
      _id: p._id,
      user: p.company_id?.company_name || "Company",
      email: p.company_id?.company_email || "N/A",
      role: "Company",
      type: "Recruitment Subscription",
      plan: p.plan_id?.plan_name || "Company Plan",
      amount: p.amount,
      createdAt: p.createdAt,
    }));

    const examTx = examPayments.map((p) => ({
      _id: p._id,
      user: p.user_id?.company_name || "Company",
      email: p.user_id?.company_email || "N/A",
      role: "Company",
      type: "AI Exam Purchase",
      plan: "AI Exam Token",
      amount: p.amount,
      createdAt: p.createdAt,
    }));

    const transactions = [...studentTx, ...companyTx, ...examTx]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(StatusCodes.OK).json({ transactions });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
