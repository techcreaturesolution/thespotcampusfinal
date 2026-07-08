import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiAward, FiCheck, FiStar, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import { loadScript } from "../../utils/loadScript";
import PageHeader from "../../common/components/PageHeader";
import Loading from "../../common/components/Loading";

const Plans = () => {
  const { user } = useOutletContext() || {};
  const [plansLoading, setPlansLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      const [plansRes, checkRes] = await Promise.all([
        customFetch.get("/recruitment-subscription/plans/active?plan_for=student"),
        customFetch.get("/payment/check"),
      ]);
      setPlans(plansRes.data.plans || []);
      setCurrentSub(checkRes.data.subscription || null);
    } catch (error) {
      toast.error("Failed to load plans and subscription data");
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchase = async (plan) => {
    setProcessing(true);
    try {
      const idempotencyKey = `payment-${plan._id}-${user?._id || "anon"}-${Date.now()}`;
      const { data } = await customFetch.post(
        "/payment",
        {
          amount: plan.price,
          plan_name: plan.plan_name,
          description: plan.description || `Student Subscription Plan - ${plan.plan_name}`,
        },
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );

      const options = {
        key: data.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "The Spot Campus",
        description: `Student Subscription Plan - ${plan.plan_name}`,
        order_id: data.order.id,
        handler: async function (response) {
          try {
            await customFetch.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Subscription activated successfully!");
            fetchData();
          } catch {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#3730a3" },
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
      toast.error(error?.response?.data?.error || "Failed to initiate payment");
    } finally {
      setProcessing(false);
    }

  };

  if (plansLoading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        icon={FiAward}
        title="Subscription Plans"
        subtitle="Choose a plan to unlock premium placement opportunities and unlimited job applications."
      />

      {/* Current Subscription Banner */}
      {currentSub && (
        <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/20 rounded-2xl border border-emerald-200/80 p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200/50 uppercase tracking-wider">
                  Active Student Plan
                </span>
              </div>
              <p className="text-xl font-extrabold text-slate-800 tracking-tight">{currentSub.plan_name}</p>
              <p className="text-xs font-semibold text-slate-500">
                Expires: {new Date(currentSub.expires_at).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 p-4 rounded-xl text-right shadow-sm shrink-0 min-w-[140px]">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">
                Active
              </p>
            </div>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FiAward className="w-12 h-12 mx-auto mb-3" />
          <p className="text-lg">No plans available at the moment.</p>
          <p className="text-sm">Please check back later.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isActive = currentSub && currentSub.plan_name === plan.plan_name;
            const isUpgrade = currentSub && plan.price > (currentSub.amount || 0);
            return (
              <div
                key={plan._id}
                className={`bg-white rounded-2xl p-6 flex flex-col shadow-sm relative overflow-hidden ${
                  isActive
                    ? "border-2 border-emerald-500 bg-emerald-50/5"
                    : index === 0
                    ? "border-2 border-primary-500"
                    : "border border-gray-200"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl flex items-center gap-0.5 uppercase tracking-wider shadow-sm">
                    <FiCheck className="w-3 h-3" /> Active
                  </div>
                )}
                {index === 0 && !isActive && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-primary-500 to-primary-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl flex items-center gap-0.5 uppercase tracking-wider shadow-sm">
                    <FiStar className="w-3 h-3 animate-pulse" /> Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{plan.plan_name}</h3>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-6">{plan.description}</p>

                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500 text-xs font-semibold">/ {plan.validity_days} days</span>
                  </div>

                  <div className="space-y-3 text-xs text-gray-600 border-t border-gray-100 pt-6 text-left">
                    <div className="flex items-start gap-2">
                      <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Up to {plan.features?.max_rounds_per_job} active job applications</span>
                    </div>
                    <div className="flex items-start gap-2">
                      {plan.features?.cv_builder_enabled ? (
                        <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                      ) : (
                        <FiX className="text-red-400 w-4 h-4 flex-shrink-0 mt-0.5" />
                      )}
                      <span>Professional CV Builder & Templates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      {plan.features?.exam_preparation_enabled ? (
                        <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                      ) : (
                        <FiX className="text-red-400 w-4 h-4 flex-shrink-0 mt-0.5" />
                      )}
                      <span>MCQ & Mock Exam Prep Hub</span>
                    </div>
                    <div className="flex items-start gap-2">
                      {plan.features?.video_interview_enabled ? (
                        <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                      ) : (
                        <FiX className="text-red-400 w-4 h-4 flex-shrink-0 mt-0.5" />
                      )}
                      <span>Video interview prep & room access</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Max {plan.features?.max_interviews_per_month} interviews per month</span>
                    </div>
                    <div className="flex items-start gap-2">
                      {plan.features?.advanced_analytics ? (
                        <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                      ) : (
                        <FiX className="text-red-400 w-4 h-4 flex-shrink-0 mt-0.5" />
                      )}
                      <span>Profile performance insights</span>
                    </div>
                    <div className="flex items-start gap-2">
                      {plan.features?.priority_support ? (
                        <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                      ) : (
                        <FiX className="text-red-400 w-4 h-4 flex-shrink-0 mt-0.5" />
                      )}
                      <span>Priority placement support</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handlePurchase(plan)}
                    disabled={processing || isActive}
                    className={`w-full font-bold py-3 px-6 rounded-xl transition text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isActive
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {processing
                      ? "Processing..."
                      : isActive
                      ? "Current Plan"
                      : isUpgrade
                      ? "Upgrade Plan"
                      : `Subscribe (₹${plan.price})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Plans;
