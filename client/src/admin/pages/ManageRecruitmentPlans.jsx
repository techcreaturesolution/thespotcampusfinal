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

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
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
          <button onClick={() => setShowForm(true)} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2">
            <FiPlus /> Create Plan
          </button>
        }
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        {plans.map((plan) => (
          <div key={plan._id} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-2 transition-all ${plan.is_active ? "border-primary-200" : "border-gray-200 opacity-60"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {plan.is_active ? "Active" : "Inactive"}
              </span>
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
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-500" />
                <span>Up to {plan.features?.max_rounds_per_job} rounds/job</span>
              </div>
              <div className="flex items-center gap-2">
                {plan.features?.video_interview_enabled ? (
                  <FiCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <FiX className="w-4 h-4 text-red-400" />
                )}
                <span>Video interviews</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-500" />
                <span>{plan.features?.max_interviews_per_month} interviews/month</span>
              </div>
              <div className="flex items-center gap-2">
                {plan.features?.advanced_analytics ? (
                  <FiCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <FiX className="w-4 h-4 text-red-400" />
                )}
                <span>Advanced analytics</span>
              </div>
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

      {subscriptions.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Subscriptions</h2>
          <DataTable
            data={subscriptions}
            searchKeys={["company_id.company_name", "plan_id.plan_name", "status"]}
            searchPlaceholder="Search subscriptions…"
            emptyMessage="No subscriptions"
            columns={[
              {
                key: "company",
                label: "Company",
                render: (sub) => (
                  <span className="font-medium text-slate-900">
                    {sub.company_id?.company_name || "N/A"}
                  </span>
                ),
              },
              {
                key: "plan",
                label: "Plan",
                render: (sub) => sub.plan_id?.plan_name || "N/A",
              },
              {
                key: "amount",
                label: "Amount",
                render: (sub) => <span className="font-semibold text-primary-600">₹{sub.amount}</span>,
              },
              {
                key: "status",
                label: "Status",
                render: (sub) => (
                  <span className={sub.status === "Paid" ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800" : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"}>
                    {sub.status}
                  </span>
                ),
              },
              {
                key: "expires",
                label: "Expires",
                render: (sub) =>
                  sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—",
              },
            ]}
          />
        </>
      )}

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
