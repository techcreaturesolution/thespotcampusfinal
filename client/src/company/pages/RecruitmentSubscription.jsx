import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiCheck, FiX, FiLayers, FiVideo, FiStar,
  FiClock, FiZap, FiShield, FiArrowLeft,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";

const RecruitmentSubscription = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, checkRes, historyRes] = await Promise.all([
        customFetch.get("/recruitment-subscription/plans/active"),
        customFetch.get("/recruitment-subscription/check"),
        customFetch.get("/recruitment-subscription/my"),
      ]);
      setPlans(plansRes.data.plans);
      setCurrentSub(checkRes.data.subscription);
      setSubscriptions(historyRes.data.subscriptions);
    } catch (error) {
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId) => {
    setProcessing(true);
    try {
      const { data } = await customFetch.post("/recruitment-subscription/order", { plan_id: planId });

      const options = {
        key: data.order.receipt?.startsWith("recruit") ? undefined : undefined,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "The Spot Campus",
        description: `Recruitment Plan - ${data.plan.plan_name}`,
        order_id: data.order.id,
        handler: async function (response) {
          try {
            await customFetch.post("/recruitment-subscription/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Subscription activated!");
            fetchData();
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: {},
        theme: { color: "#4f46e5" },
      };

      if (window.Razorpay) {
        const razor = new window.Razorpay(options);
        razor.open();
      } else {
        toast.error("Payment gateway not loaded. Please refresh and try again.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to create order");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiLayers}
        title="Recruitment Subscription"
        subtitle="Unlock multi-round recruitment and video interview features."
        action={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 transition-all duration-200 flex items-center gap-2 text-sm"
          >
            <FiArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      {/* Current Subscription */}
      {currentSub && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 border-2 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FiShield className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Active Subscription</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{currentSub.plan_id?.plan_name}</p>
              <p className="text-sm text-gray-600 mt-1">
                Expires: {new Date(currentSub.expires_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Interviews used</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentSub.interviews_used}/{currentSub.plan_id?.features?.max_interviews_per_month || "∞"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan, idx) => (
          <div key={plan._id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden border-2 transition-all hover:shadow-lg ${
              idx === 1 ? "border-primary-400 ring-2 ring-primary-100" : "border-gray-200"
            }`}>
            {idx === 1 && (
              <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
            )}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{plan.plan_name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
              <span className="text-gray-400">/{plan.validity_days} days</span>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <FiLayers className="w-4 h-4 text-primary-500" />
                <span>Up to {plan.features?.max_rounds_per_job} rounds per job</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {plan.features?.video_interview_enabled ? (
                  <FiVideo className="w-4 h-4 text-primary-500" />
                ) : (
                  <FiX className="w-4 h-4 text-red-400" />
                )}
                <span>{plan.features?.video_interview_enabled ? "Video interviews included" : "No video interviews"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FiClock className="w-4 h-4 text-primary-500" />
                <span>{plan.features?.max_interviews_per_month} interviews/month</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {plan.features?.advanced_analytics ? (
                  <FiZap className="w-4 h-4 text-primary-500" />
                ) : (
                  <FiX className="w-4 h-4 text-red-400" />
                )}
                <span>{plan.features?.advanced_analytics ? "Advanced analytics" : "Basic analytics"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {plan.features?.priority_support ? (
                  <FiStar className="w-4 h-4 text-primary-500" />
                ) : (
                  <FiX className="w-4 h-4 text-red-400" />
                )}
                <span>{plan.features?.priority_support ? "Priority support" : "Standard support"}</span>
              </div>
            </div>
            <button onClick={() => handlePurchase(plan._id)} disabled={processing}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${
                idx === 1
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              } disabled:opacity-50`}>
              {processing ? "Processing..." : currentSub ? "Upgrade Plan" : "Subscribe Now"}
            </button>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <FiLayers className="w-10 h-10 mx-auto mb-3" />
            <p>No subscription plans available yet.</p>
            <p className="text-sm mt-1">Contact admin to set up recruitment plans.</p>
          </div>
        )}
      </div>

      {/* History */}
      {subscriptions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Subscription History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Plan</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Period</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub._id} className="border-b border-gray-100">
                    <td className="py-3 px-3 font-medium">{sub.plan_id?.plan_name || "N/A"}</td>
                    <td className="py-3 px-3">₹{sub.amount}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sub.status === "Paid" ? "bg-green-100 text-green-700" :
                        sub.status === "Expired" ? "bg-gray-100 text-gray-500" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>{sub.status}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString() : "-"} — {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentSubscription;
