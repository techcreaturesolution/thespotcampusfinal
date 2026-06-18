import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiCreditCard,
  FiSearch,
  FiFilter,
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiMail,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";

const AllTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await customFetch.get("/stats/transactions");
      setTransactions(data.transactions || []);
    } catch (error) {
      toast.error("Failed to load payment transactions");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const user = tx.user || "";
    const email = tx.email || "";
    const type = tx.type || "";
    const plan = tx.plan || "";
    const amount = tx.amount ? tx.amount.toString() : "";

    const matchesSearch =
      user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      amount.includes(searchQuery);

    if (!matchesSearch) return false;

    if (categoryFilter === "student") return tx.role === "Student";
    if (categoryFilter === "company_plan") return tx.type === "Recruitment Subscription";

    return true;
  });

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header and Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/admin/reports"
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs flex items-center justify-center"
            title="Back to Reports"
          >
            <FiArrowLeft className="w-4 h-4" />
          </Link>
          <PageHeader
            icon={FiCreditCard}
            title="Transaction Ledger"
            subtitle="Complete list of all system payments, subscriptions, and exam tokens."
            badge={`${filteredTransactions.length} total`}
          />
        </div>
      </div>

      {/* Main Glassmorphism Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {/* Search & Filter Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by buyer, email, plan..."
              className="w-full pl-10 pr-4 py-2 border border-slate-250 rounded-xl focus:ring-2 focus:ring-[#3730a3]/30 focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-extrabold text-slate-400 mr-1.5 flex items-center gap-1 shrink-0">
              <FiFilter className="w-3.5 h-3.5" /> FILTERS:
            </span>
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                categoryFilter === "all" ? "bg-[#3730a3] text-white" : "hover:bg-slate-100 text-slate-650"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCategoryFilter("student")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                categoryFilter === "student" ? "bg-teal-600 text-white" : "hover:bg-slate-100 text-slate-650"
              }`}
            >
              Student Plans
            </button>
            <button
              onClick={() => setCategoryFilter("company_plan")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                categoryFilter === "company_plan" ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-650"
              }`}
            >
              Company Subscriptions
            </button>
          </div>
        </div>

        {/* Transactions Table */}
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
              {filteredTransactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100/80 flex items-center justify-center text-slate-400">
                        <FiUser className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-850 leading-snug">{tx.user}</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center gap-0.5">
                          <FiMail className="w-3 h-3" /> {tx.email}
                        </p>
                      </div>
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
                  <td className="py-4 px-4 font-extrabold text-slate-850">
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="py-4 px-5 text-right font-semibold text-slate-500 text-xs">
                    <div className="flex items-center justify-end gap-1.5">
                      <FiCalendar className="w-3.5 h-3.5 text-slate-350" />
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "-"}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-20 text-slate-400">
                    <FiCreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-extrabold text-slate-750 text-base">No transactions found</p>
                    <p className="text-xs text-slate-450 mt-1">
                      No payment records match the selected filters or search query.
                    </p>
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

export default AllTransactions;
