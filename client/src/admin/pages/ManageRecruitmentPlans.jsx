import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiCheck, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import CreatePlanModal from "../components/CreatePlanModal";

const ManageRecruitmentPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [studentPayments, setStudentPayments] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState("company");

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
    fetchStudentPayments();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await customFetch.get("/recruitment-subscription/plans");
      setPlans(data.plans);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data } = await customFetch.get("/recruitment-subscription/all");
      setSubscriptions(data.subscriptions);
    } catch {}
  };

  const fetchStudentPayments = async () => {
    try {
      const { data } = await customFetch.get("/payment");
      setStudentPayments(data.payments || []);
    } catch (error) {
      console.error("Failed to load student payments", error);
    }
  };

  const handleSubmit = async (planData) => {
    try {
      if (editingPlan) {
        await customFetch.patch(`/recruitment-subscription/plans/${editingPlan._id}`, planData);
        toast.success("Plan updated");
      } else {
        await customFetch.post("/recruitment-subscription/plans", planData);
        toast.success("Plan created");
      }
      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to save plan");
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await customFetch.delete(`/recruitment-subscription/plans/${id}`);
      toast.success("Plan deleted");
      fetchPlans();
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const toggleActive = async (plan) => {
    try {
      await customFetch.patch(`/recruitment-subscription/plans/${plan._id}`, {
        is_active: !plan.is_active,
      });
      toast.success(`Plan ${plan.is_active ? "deactivated" : "activated"}`);
      fetchPlans();
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPlan(null);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiDollarSign}
        title="Recruitment Plans"
        subtitle="Manage subscription plans for multi-round recruitment and video interviews."
        badge={`${plans.length} plans`}
        action={
          <button onClick={() => setShowForm(true)} className="vibrant-btn text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 hover:opacity-95 active:scale-95 flex items-center gap-2 text-sm shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20">
            <FiPlus className="w-4 h-4" /> Create Plan
          </button>
        }
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        {plans.map((plan) => (
          <div key={plan._id} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-2 transition-all ${plan.is_active ? "border-primary-200" : "border-gray-200 opacity-60"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {(plan.plan_for || "company") === "student" ? "Student" : "Company"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(plan)} className="p-1 text-gray-400 hover:text-primary-600">
                  <FiEdit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(plan._id)} className="p-1 text-gray-400 hover:text-red-600">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{plan.plan_name}</h3>
            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-primary-600">₹{plan.price}</span>
              <span className="text-gray-400 text-sm">/{plan.validity_days} days</span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-left">
              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-500" />
                <span>
                  {plan.plan_for === "student"
                    ? `Up to ${plan.features?.max_rounds_per_job} active applications`
                    : `Up to ${plan.features?.max_rounds_per_job} rounds/job`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {plan.features?.video_interview_enabled ? (
                  <FiCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <FiX className="w-4 h-4 text-red-400" />
                )}
                <span>
                  {plan.plan_for === "student"
                    ? "Video interview prep & room access"
                    : "Video interviews"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-500" />
                <span>
                  {plan.plan_for === "student"
                    ? `Max ${plan.features?.max_interviews_per_month} interviews/month`
                    : `${plan.features?.max_interviews_per_month} interviews/month`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {plan.features?.advanced_analytics ? (
                  <FiCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <FiX className="w-4 h-4 text-red-400" />
                )}
                <span>
                  {plan.plan_for === "student"
                    ? "Profile performance insights"
                    : "Advanced analytics"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {plan.features?.priority_support ? (
                  <FiCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <FiX className="w-4 h-4 text-red-400" />
                )}
                <span>
                  {plan.plan_for === "student"
                    ? "Priority placement support"
                    : "Priority support"}
                </span>
              </div>
              {plan.plan_for === "student" && (
                <>
                  <div className="flex items-center gap-2">
                    {plan.features?.cv_builder_enabled ? (
                      <FiCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <FiX className="w-4 h-4 text-red-400" />
                    )}
                    <span>Professional CV Builder & Templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.features?.exam_preparation_enabled ? (
                      <FiCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <FiX className="w-4 h-4 text-red-400" />
                    )}
                    <span>MCQ & Mock Exam Prep Hub</span>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => toggleActive(plan)}
              className={`mt-4 w-full py-2 rounded-lg text-sm font-medium ${plan.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
              {plan.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <FiDollarSign className="w-10 h-10 mx-auto mb-3" />
            <p>No plans created yet. Create your first recruitment plan.</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-white to-[#fcfdfe] rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
          <h2 className="text-lg font-bold text-slate-800">Subscription History</h2>
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 w-fit">
            <button
              type="button"
              onClick={() => setActiveSubTab("company")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeSubTab === "company"
                  ? "bg-white text-[#3730a3] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Company Subscriptions ({subscriptions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("student")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeSubTab === "student"
                  ? "bg-white text-[#3730a3] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Student Payments ({studentPayments.length})
            </button>
          </div>
        </div>

        {activeSubTab === "company" ? (
          <DataTable
            data={subscriptions}
            searchKeys={["company_id.company_name", "plan_id.plan_name", "status"]}
            searchPlaceholder="Search company subscriptions…"
            emptyMessage="No company subscriptions found."
            columns={[
              {
                key: "company",
                label: "Company",
                render: (sub) => (
                  <span className="font-extrabold text-slate-800 text-sm">
                    {sub.company_id?.company_name || "N/A"}
                  </span>
                ),
              },
              {
                key: "plan",
                label: "Plan Name",
                render: (sub) => (
                  <span className="font-semibold text-slate-600">
                    {sub.plan_id?.plan_name || "N/A"}
                  </span>
                ),
              },
              {
                key: "amount",
                label: "Amount",
                render: (sub) => <span className="font-black text-indigo-650">₹{sub.amount}</span>,
              },
              {
                key: "status",
                label: "Status",
                className: "text-center",
                render: (sub) => (
                  <span className={sub.status === "Paid" ? "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100" : "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"}>
                    {sub.status}
                  </span>
                ),
              },
              {
                key: "expires",
                label: "Expires At",
                render: (sub) => (
                  <span className="font-semibold text-slate-500">
                    {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—"}
                  </span>
                ),
              },
              {
                key: "purchased_at",
                label: "Purchased At",
                render: (sub) => (
                  <span className="font-semibold text-slate-400">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
            ]}
          />
        ) : (
          <DataTable
            data={studentPayments}
            searchKeys={["user_name", "user_enrollment", "user_email", "plan_name", "status"]}
            searchPlaceholder="Search student payments…"
            emptyMessage="No student payments found."
            columns={[
              {
                key: "student",
                label: "Student Details",
                render: (pay) => (
                  <div className="py-1.5 space-y-0.5 text-left">
                    <span className="font-extrabold text-slate-800 block text-sm">
                      {pay.user_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/50 uppercase tracking-wide">
                        Roll: {pay.user_enrollment}
                      </span>
                      <span className="text-[10px] text-slate-450 font-semibold">
                        {pay.user_email}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "plan",
                label: "Plan Purchased",
                render: (pay) => (
                  <span className="font-semibold text-slate-600">
                    {pay.plan_name}
                  </span>
                ),
              },
              {
                key: "amount",
                label: "Amount",
                render: (pay) => <span className="font-black text-indigo-650">₹{pay.amount}</span>,
              },
              {
                key: "status",
                label: "Status",
                className: "text-center",
                render: (pay) => (
                  <span className={pay.status === "Paid" ? "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100" : "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"}>
                    {pay.status}
                  </span>
                ),
              },
              {
                key: "expires",
                label: "Expires At",
                render: (pay) => (
                  <span className="font-semibold text-slate-500">
                    {pay.expires_at ? new Date(pay.expires_at).toLocaleDateString() : "—"}
                  </span>
                ),
              },
              {
                key: "purchased_at",
                label: "Purchased At",
                render: (pay) => (
                  <span className="font-semibold text-slate-400">
                    {new Date(pay.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
            ]}
          />
        )}
      </div>

      <CreatePlanModal
        isOpen={showForm}
        onClose={resetForm}
        plan={editingPlan}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ManageRecruitmentPlans;
