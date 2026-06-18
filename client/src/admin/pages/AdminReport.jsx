import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiBriefcase,
  FiBookOpen,
  FiFileText,
  FiTrendingUp,
  FiGrid,
  FiUser,
  FiMessageSquare,
  FiDollarSign,
  FiActivity,
  FiPrinter,
  FiDownload,
  FiAward,
  FiCheckCircle,
  FiAlertCircle,
  FiCreditCard,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";

const AdminReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await customFetch.get("/stats/admin-report");
      setData(response.data);
    } catch (error) {
      toast.error("Failed to load administration reports");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    try {
      const summaryData = [
        { Metric: "Total Students", Value: data.counts.students },
        { Metric: "  └ Verified (By TPO)", Value: data.counts.verifiedStudents },
        { Metric: "  └ Pending Verification", Value: data.counts.pendingStudents },
        { Metric: "Total Companies", Value: data.counts.companies },
        { Metric: "  └ Approved", Value: data.counts.approvedCompanies },
        { Metric: "  └ Pending Approval", Value: data.counts.pendingCompanies },
        { Metric: "  └ Rejected", Value: data.counts.rejectedCompanies },
        { Metric: "Total Colleges", Value: data.counts.colleges },
        { Metric: "  └ Approved", Value: data.counts.approvedColleges },
        { Metric: "  └ Pending Approval", Value: data.counts.pendingColleges },
        { Metric: "  └ Rejected", Value: data.counts.rejectedColleges },
        { Metric: "Total Universities", Value: data.counts.universities },
        { Metric: "Total TPOs", Value: data.counts.tpos },
        { Metric: "Total Jobs Posted", Value: data.counts.jobs },
        { Metric: "Total Applications", Value: data.counts.applications },
        { Metric: "Total Exams Conducted", Value: data.counts.exams },
        { Metric: "Total Answer Sheets", Value: data.counts.papers },
        { Metric: "Total Interview Sessions", Value: data.counts.interviews },
        { Metric: "Total Contact Inquiries", Value: data.counts.contacts },
      ];

      const financialData = [
        { Category: "Student Subscription Revenue", Amount: `INR ${data.financials.studentRevenue}`, Transactions: data.financials.studentPaymentsCount },
        { Category: "Company Subscription Revenue", Amount: `INR ${data.financials.companyRevenue}`, Transactions: data.financials.companyPaymentsCount },
        { Category: "AI Exam Revenue", Amount: `INR ${data.financials.examRevenue}`, Transactions: data.financials.examPaymentsCount },
        { Category: "Total System Revenue", Amount: `INR ${data.financials.totalRevenue}`, Transactions: data.financials.studentPaymentsCount + data.financials.companyPaymentsCount + data.financials.examPaymentsCount },
      ];

      const transactionData = data.recentTransactions.map((tx) => ({
        User: tx.user,
        Email: tx.email,
        Role: tx.role,
        "Transaction Type": tx.type,
        "Plan Purchased": tx.plan,
        Amount: `INR ${tx.amount}`,
        Date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "N/A",
      }));

      const placementData = data.recentPlacements.map((placement) => ({
        Student: placement.student_id?.student_name || "Unknown Student",
        Email: placement.student_id?.student_email || "N/A",
        Company: placement.job_id?.job_company_id?.company_name || "Unknown Company",
        Position: placement.job_id?.job_title || "N/A",
        Date: placement.updatedAt ? new Date(placement.updatedAt).toLocaleDateString() : "N/A",
      }));

      // Generate sheets
      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wsFinancials = XLSX.utils.json_to_sheet(financialData);
      const wsTransactions = XLSX.utils.json_to_sheet(transactionData);
      const wsPlacements = XLSX.utils.json_to_sheet(placementData);

      // Add sheets to workbook
      XLSX.utils.book_append_sheet(wb, wsSummary, "System Summary");
      XLSX.utils.book_append_sheet(wb, wsFinancials, "Financial Revenue");
      XLSX.utils.book_append_sheet(wb, wsTransactions, "Recent Transactions");
      XLSX.utils.book_append_sheet(wb, wsPlacements, "Recent Placements");

      // Save workbook
      XLSX.writeFile(wb, "TheSpotCampus_Comprehensive_System_Report.xlsx");
      toast.success("Comprehensive Excel report exported successfully");
    } catch (error) {
      toast.error("Failed to export Excel spreadsheet");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Loading />;
  if (!data) return <div className="text-center py-10">No report data found.</div>;

  const placementRate = data.counts.applications
    ? ((data.applications.selected / data.counts.applications) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6 print:p-8 print:bg-white print:text-black">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <PageHeader
          icon={FiActivity}
          title="System Analytics & Reports"
          subtitle="Comprehensive overview of platform usage, recruitment pipelines, and transaction statistics."
        />
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={handlePrint}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-2 text-sm"
          >
            <FiPrinter className="w-4 h-4" /> Print Report
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-[#3730a3] hover:bg-[#2d278b] text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center gap-2 text-sm"
          >
            <FiDownload className="w-4 h-4" /> Export to Excel
          </button>
        </div>
      </div>

      {/* Styled Header for Print Mode Only */}
      <div className="hidden print:block border-b-2 border-slate-350 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold text-[#1e1b4b] uppercase tracking-wide">The Spot Campus</h1>
        <p className="text-sm font-semibold text-slate-500 mt-1">Platform Analytics & Management Report</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Generated on: {new Date().toLocaleString()}</p>
      </div>

      {/* Row 1: Platform Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Students</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><FiUsers className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800">{data.counts.students}</h3>
            <p className="text-[9px] text-slate-400 font-bold mt-1">
              {data.counts.verifiedStudents} verified • {data.counts.pendingStudents} pending
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Companies</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600"><FiBriefcase className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800">{data.counts.companies}</h3>
            <p className="text-[9px] text-slate-400 font-bold mt-1">
              {data.counts.approvedCompanies} approved • {data.counts.pendingCompanies} pending
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Colleges</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><FiBookOpen className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800">{data.counts.colleges}</h3>
            <p className="text-[9px] text-slate-400 font-bold mt-1">
              {data.counts.approvedColleges} approved • {data.counts.pendingColleges} pending
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Jobs Posted</span>
            <div className="p-1.5 rounded-lg bg-green-50 text-green-600"><FiFileText className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800">{data.counts.jobs}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[105px] col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Exams Conducted</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600"><FiActivity className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800">{data.counts.exams}</h3>
        </div>
      </div>

      {/* Verification Statuses Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Student verification */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <FiUser className="text-blue-500" /> Student Statuses
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1"><FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Verified by TPO</span>
              <span className="text-slate-800 font-bold">{data.counts.verifiedStudents}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1"><FiAlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pending Verification</span>
              <span className="text-slate-800 font-bold">{data.counts.pendingStudents}</span>
            </div>
            <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Total Registered</span>
              <span className="text-[#3730a3]">{data.counts.students}</span>
            </div>
          </div>
        </div>

        {/* Company verification */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <FiBriefcase className="text-purple-500" /> Company Verification
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1"><FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Approved Accounts</span>
              <span className="text-slate-800 font-bold">{data.counts.approvedCompanies}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1"><FiAlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pending Admin Approval</span>
              <span className="text-slate-800 font-bold">{data.counts.pendingCompanies}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1"><FiAlertCircle className="w-3.5 h-3.5 text-rose-500" /> Rejected / Deactivated</span>
              <span className="text-slate-800 font-bold">{data.counts.rejectedCompanies}</span>
            </div>
          </div>
        </div>

        {/* College verification */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <FiBookOpen className="text-indigo-500" /> College Verification
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1"><FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Approved Campus</span>
              <span className="text-slate-800 font-bold">{data.counts.approvedColleges}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1"><FiAlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pending Admin Approval</span>
              <span className="text-slate-800 font-bold">{data.counts.pendingColleges}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1"><FiAlertCircle className="w-3.5 h-3.5 text-rose-500" /> Rejected / Deactivated</span>
              <span className="text-slate-800 font-bold">{data.counts.rejectedColleges}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Financial Analytics Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FiDollarSign className="text-[#3730a3] w-5 h-5" /> Financial Revenue Analytics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-[#3730a3] to-indigo-800 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[120px]">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Total Revenue</span>
            <div>
              <h3 className="text-3xl font-extrabold">₹{data.financials.totalRevenue.toLocaleString()}</h3>
              <p className="text-[10px] text-indigo-200 font-semibold mt-1">
                From {data.financials.studentPaymentsCount + data.financials.companyPaymentsCount + data.financials.examPaymentsCount} successful transactions
              </p>
            </div>
          </div>

          {/* Student Subscriptions */}
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[120px]">
            <span className="text-xs font-bold text-teal-100 uppercase tracking-wider">Student Plan Purchases</span>
            <div>
              <h3 className="text-3xl font-extrabold">₹{data.financials.studentRevenue.toLocaleString()}</h3>
              <p className="text-[10px] text-teal-100 font-semibold mt-1">
                {data.financials.studentPaymentsCount} student subscriptions purchased
              </p>
            </div>
          </div>

          {/* Company Subscriptions */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[120px]">
            <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Company Plan Purchases</span>
            <div>
              <h3 className="text-3xl font-extrabold">₹{data.financials.companyRevenue.toLocaleString()}</h3>
              <p className="text-[10px] text-blue-100 font-semibold mt-1">
                {data.financials.companyPaymentsCount} company subscriptions purchased
              </p>
            </div>
          </div>

          {/* Exams Created / Conducted */}
          <div className="bg-gradient-to-br from-orange-500 to-rose-600 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[120px]">
            <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">Exams Created / Conducted</span>
            <div>
              <h3 className="text-3xl font-extrabold">{data.counts.exams} Exams</h3>
              <p className="text-[10px] text-orange-100 font-semibold mt-1">
                Total assessments configured by companies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Funnel and Pipeline Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job & Placements metrics */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-50">
              <FiBriefcase className="text-[#3730a3]" /> Jobs & Placements
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-650 mb-1">
                  <span>Placement Rate (Hiring Conversion)</span>
                  <span className="text-[#3730a3]">{placementRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-[#3730a3] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${placementRate}%` }}
                  />
                </div>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">
                  Percentage of student applications resulting in direct hire selection.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">Active Job Postings</span>
                  <h4 className="text-xl font-black text-slate-750">{data.jobs.active}</h4>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">Closed Job Postings</span>
                  <h4 className="text-xl font-black text-slate-750">{data.jobs.closed}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recruitment Pipeline Funnel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-50">
              <FiTrendingUp className="text-[#3730a3]" /> Application Outcomes
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-emerald-700 mb-1">
                  <span>Selected</span>
                  <span>{data.applications.selected} applications</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${data.counts.applications ? (data.applications.selected / data.counts.applications) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-rose-700 mb-1">
                  <span>Rejected</span>
                  <span>{data.applications.rejected} applications</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full"
                    style={{ width: `${data.counts.applications ? (data.applications.rejected / data.counts.applications) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-amber-700 mb-1">
                  <span>Pending / Under Review</span>
                  <span>{data.applications.pending} applications</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${data.counts.applications ? (data.applications.pending / data.counts.applications) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Financial Transactions Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 p-6 border-b border-slate-100 flex items-center gap-2">
          <FiCreditCard className="text-[#3730a3] w-5 h-5" /> Recent Financial Transactions Ledger
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fd] text-[#3730a3] border-b border-slate-200/80">
                <th className="text-left py-3.5 px-5 font-extrabold uppercase tracking-wider text-xs">Buyer / Account</th>
                <th className="text-left py-3.5 px-4 font-extrabold uppercase tracking-wider text-xs">Category</th>
                <th className="text-left py-3.5 px-4 font-extrabold uppercase tracking-wider text-xs">Purchased Item / Plan</th>
                <th className="text-left py-3.5 px-4 font-extrabold uppercase tracking-wider text-xs">Amount</th>
                <th className="text-right py-3.5 px-5 font-extrabold uppercase tracking-wider text-xs">Transaction Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentTransactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-5">
                    <div>
                      <p className="font-extrabold text-slate-850 leading-snug">{tx.user}</p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{tx.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-600">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                      tx.role === "Student" 
                        ? "bg-teal-50 border-teal-200 text-teal-700" 
                        : "bg-blue-50 border-blue-200 text-blue-700"
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-700">
                    {tx.plan}
                  </td>
                  <td className="py-4 px-4 font-extrabold text-slate-800">
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="py-4 px-5 text-right font-semibold text-slate-500 text-xs">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}

              {data.recentTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400 text-xs font-semibold">
                    No payment transactions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.recentTransactions.length > 0 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center print:hidden">
            <Link
              to="/dashboard/admin/transactions"
              className="text-xs font-bold text-[#3730a3] hover:text-[#2d278b] transition inline-flex items-center gap-1"
            >
              View All Transactions &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Row 5: Recent Placements Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 p-6 border-b border-slate-100 flex items-center gap-2">
          <FiAward className="text-[#3730a3] w-5 h-5" /> Recent Success Placement Board
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fd] text-[#3730a3] border-b border-slate-200/80">
                <th className="text-left py-3.5 px-5 font-extrabold uppercase tracking-wider text-xs">Student</th>
                <th className="text-left py-3.5 px-4 font-extrabold uppercase tracking-wider text-xs">Hired Company</th>
                <th className="text-left py-3.5 px-4 font-extrabold uppercase tracking-wider text-xs">Position / Role</th>
                <th className="text-right py-3.5 px-5 font-extrabold uppercase tracking-wider text-xs">Placement Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentPlacements.map((placement) => {
                const student = placement.student_id || {};
                const job = placement.job_id || {};
                const company = job.job_company_id || {};

                return (
                  <tr key={placement._id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-5">
                      <div>
                        <p className="font-extrabold text-slate-850 leading-snug">{student.student_name || "Unknown Student"}</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{student.student_email || "N/A"}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-700">
                      {company.company_name || "Unknown Company"}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-800 leading-snug">{job.job_title || "-"}</p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{job.job_position || "-"}</p>
                    </td>
                    <td className="py-4 px-5 text-right font-semibold text-slate-500 text-xs">
                      {placement.updatedAt ? new Date(placement.updatedAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                );
              })}

              {data.recentPlacements.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-slate-400 text-xs font-semibold">
                    No recent hiring events registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReport;
