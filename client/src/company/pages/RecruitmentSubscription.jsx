import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiCheck, FiX, FiLayers, FiVideo, FiStar,
  FiClock, FiZap, FiShield, FiArrowLeft,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import { loadScript } from "../../utils/loadScript";
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
        customFetch.get("/recruitment-subscription/plans/active?plan_for=company"),
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
        key: data.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
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

      const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!loaded) {
        toast.error("Failed to load payment gateway. Please check your internet connection.");
        setProcessing(false);
        return;
      }

      const razor = new window.Razorpay(options);
      razor.open();
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
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-5 rounded-xl border border-slate-200 transition-all duration-200 flex items-center gap-2 text-sm shadow-sm hover:scale-105 active:scale-95"
          >
            <FiArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      {/* Current Subscription */}
      {currentSub && (
        <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/20 rounded-2xl border border-emerald-200/80 p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200/50 uppercase tracking-wider">
                  <FiShield className="w-3.5 h-3.5" /> Active Subscription
                </span>
              </div>
              <p className="text-xl font-extrabold text-slate-800 tracking-tight">{currentSub.plan_id?.plan_name}</p>
              <p className="text-xs font-semibold text-slate-500">
                Expires: {new Date(currentSub.expires_at).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 p-4 rounded-xl text-right shadow-sm shrink-0 min-w-[140px]">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Interviews Used</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {currentSub.interviews_used} <span className="text-xs font-bold text-slate-400">/ {currentSub.plan_id?.features?.max_interviews_per_month || "∞"}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan, idx) => {
          const isActive = currentSub && (currentSub.plan_id?._id === plan._id || currentSub.plan_id?.plan_name === plan.plan_name);
          return (
            <div key={plan._id}
              className={`bg-white rounded-2xl p-6 relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                isActive
                  ? "border-2 border-emerald-500 bg-emerald-50/5"
                  : idx === 1 
                  ? "border-2 border-[#3730a3] bg-gradient-to-b from-indigo-50/20 to-white shadow-sm hover:border-[#3730a3]" 
                  : "border border-slate-200/80 hover:border-slate-300"
              }`}>
              {isActive && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-bl-xl tracking-wider">
                  ACTIVE
                </div>
              )}
              {idx === 1 && !isActive && (
                <div className="absolute top-0 right-0 bg-[#3730a3] text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-bl-xl tracking-wider">
                  POPULAR
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{plan.plan_name}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">{plan.description}</p>
              </div>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-800">₹{plan.price}</span>
                <span className="text-slate-400 text-xs font-bold">/{plan.validity_days} days</span>
              </div>
              <div className="space-y-3.5 mb-6 text-sm font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <FiLayers className="w-4 h-4 text-[#2563eb] shrink-0" />
                  <span>Up to {plan.features?.max_rounds_per_job} rounds per job</span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.features?.video_interview_enabled ? (
                    <FiVideo className="w-4 h-4 text-[#2563eb] shrink-0" />
                  ) : (
                    <FiX className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={plan.features?.video_interview_enabled ? "text-slate-700" : "text-slate-400"}>
                    {plan.features?.video_interview_enabled ? "Video interviews included" : "No video interviews"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-[#2563eb] shrink-0" />
                  <span>{plan.features?.max_interviews_per_month} interviews/month</span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.features?.advanced_analytics ? (
                    <FiZap className="w-4 h-4 text-[#2563eb] shrink-0" />
                  ) : (
                    <FiX className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={plan.features?.advanced_analytics ? "text-slate-700" : "text-slate-400"}>
                    {plan.features?.advanced_analytics ? "Advanced analytics" : "Basic analytics"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.features?.priority_support ? (
                    <FiStar className="w-4 h-4 text-[#2563eb] shrink-0" />
                  ) : (
                    <FiX className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className={plan.features?.priority_support ? "text-slate-700" : "text-slate-400"}>
                    {plan.features?.priority_support ? "Priority support" : "Standard support"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handlePurchase(plan._id)}
                disabled={processing || isActive}
                className={`w-full py-3 rounded-xl font-bold transition-all duration-200 text-sm ${
                  isActive
                    ? "bg-slate-100 text-slate-450 border border-slate-200 cursor-not-allowed shadow-none"
                    : idx === 1
                    ? "vibrant-btn text-white shadow-md hover:shadow-lg hover:shadow-indigo-500/20"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processing
                  ? "Processing..."
                  : isActive
                  ? "Current Plan"
                  : currentSub
                  ? "Upgrade Plan"
                  : "Subscribe Now"}
              </button>
            </div>
          );
        })}
        {plans.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <FiLayers className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">No subscription plans available yet.</p>
            <p className="text-xs text-slate-500 mt-1">Contact system admin to configure recruitment plans.</p>
          </div>
        )}
      </div>

      {/* History */}
      {subscriptions.length > 0 && (
        <div className="bg-white rounded-2xl border-t-4 border-t-[#3730a3] border-x border-b border-slate-200/80 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Subscription History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0f2fa] text-[#3730a3] border-b border-slate-200">
                  <th className="text-left py-3.5 px-6 font-bold uppercase tracking-wider text-xs">Plan</th>
                  <th className="text-left py-3.5 px-6 font-bold uppercase tracking-wider text-xs">Amount</th>
                  <th className="text-left py-3.5 px-6 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left py-3.5 px-6 font-bold uppercase tracking-wider text-xs">Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-slate-800">{sub.plan_id?.plan_name || "N/A"}</td>
                    <td className="py-4 px-6 font-semibold text-slate-600">₹{sub.amount}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        sub.status === "Paid" ? "bg-green-100 text-green-700" :
                        sub.status === "Expired" ? "bg-gray-100 text-gray-500" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>{sub.status}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">
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
