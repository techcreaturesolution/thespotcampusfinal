import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiCheck, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const ManageRecruitmentPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [form, setForm] = useState({
    plan_name: "",
    description: "",
    price: "",
    validity_days: 30,
    features: {
      max_rounds_per_job: 5,
      video_interview_enabled: true,
      max_interviews_per_month: 50,
      advanced_analytics: false,
      priority_support: false,
    },
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editingPlan) {
        await customFetch.patch(`/recruitment-subscription/plans/${editingPlan._id}`, payload);
        toast.success("Plan updated");
      } else {
        await customFetch.post("/recruitment-subscription/plans", payload);
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
    setForm({
      plan_name: plan.plan_name,
      description: plan.description,
      price: plan.price,
      validity_days: plan.validity_days,
      features: { ...plan.features },
    });
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
    setForm({
      plan_name: "", description: "", price: "", validity_days: 30,
      features: {
        max_rounds_per_job: 5, video_interview_enabled: true,
        max_interviews_per_month: 50, advanced_analytics: false, priority_support: false,
      },
    });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment Plans & Pricing</h1>
          <p className="text-gray-500 mt-1">Manage subscription plans for multi-round recruitment</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <FiPlus /> Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {plans.map((plan) => (
          <div key={plan._id} className={`card border-2 ${plan.is_active ? "border-primary-200" : "border-gray-200 opacity-60"}`}>
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

      {/* Subscriptions Table */}
      {subscriptions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Subscriptions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Company</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Plan</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Expires</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub._id} className="border-b border-gray-100">
                    <td className="py-3 px-3">{sub.company_id?.company_name || "N/A"}</td>
                    <td className="py-3 px-3">{sub.plan_id?.plan_name || "N/A"}</td>
                    <td className="py-3 px-3">₹{sub.amount}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sub.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>{sub.status}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Plan Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPlan ? "Edit Plan" : "Create New Plan"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input type="text" className="input-field" value={form.plan_name}
                  onChange={(e) => setForm({ ...form, plan_name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input-field" rows="2" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" className="input-field" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validity (days)</label>
                  <input type="number" className="input-field" value={form.validity_days}
                    onChange={(e) => setForm({ ...form, validity_days: parseInt(e.target.value) })} min="1" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Max Rounds Per Job</label>
                    <input type="number" className="input-field w-20 text-sm" value={form.features.max_rounds_per_job}
                      onChange={(e) => setForm({ ...form, features: { ...form.features, max_rounds_per_job: parseInt(e.target.value) } })} min="1" max="20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Max Interviews Per Month</label>
                    <input type="number" className="input-field w-20 text-sm" value={form.features.max_interviews_per_month}
                      onChange={(e) => setForm({ ...form, features: { ...form.features, max_interviews_per_month: parseInt(e.target.value) } })} min="1" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Video Interviews</label>
                    <input type="checkbox" checked={form.features.video_interview_enabled}
                      onChange={(e) => setForm({ ...form, features: { ...form.features, video_interview_enabled: e.target.checked } })}
                      className="rounded border-gray-300 text-primary-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Advanced Analytics</label>
                    <input type="checkbox" checked={form.features.advanced_analytics}
                      onChange={(e) => setForm({ ...form, features: { ...form.features, advanced_analytics: e.target.checked } })}
                      className="rounded border-gray-300 text-primary-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Priority Support</label>
                    <input type="checkbox" checked={form.features.priority_support}
                      onChange={(e) => setForm({ ...form, features: { ...form.features, priority_support: e.target.checked } })}
                      className="rounded border-gray-300 text-primary-600" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingPlan ? "Update Plan" : "Create Plan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRecruitmentPlans;
