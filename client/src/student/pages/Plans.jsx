import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiAward, FiCheck, FiStar, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import PageHeader from "../../common/components/PageHeader";
import Loading from "../../common/components/Loading";

const Plans = () => {
  const { user } = useOutletContext() || {};
  const [plansLoading, setPlansLoading] = useState(true);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await customFetch.get("/recruitment-subscription/plans/active");
      setPlans(data.plans || []);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setPlansLoading(false);
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

      {plans.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FiAward className="w-12 h-12 mx-auto mb-3" />
          <p className="text-lg">No plans available at the moment.</p>
          <p className="text-sm">Please check back later.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={plan._id}
              className={`bg-white rounded-2xl p-6 flex flex-col shadow-sm relative overflow-hidden ${
                index === 0 ? "border-2 border-primary-500" : "border border-gray-200"
              }`}
            >
              {index === 0 && (
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

                <div className="space-y-3 text-xs text-gray-600 border-t border-gray-100 pt-6">
                  <div className="flex items-start gap-2">
                    <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Up to {plan.features?.max_rounds_per_job} rounds per job</span>
                  </div>
                  <div className="flex items-start gap-2">
                    {plan.features?.video_interview_enabled ? (
                      <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <FiX className="text-red-400 w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <span>Video interviews</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{plan.features?.max_interviews_per_month} interviews per month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    {plan.features?.advanced_analytics ? (
                      <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <FiX className="text-red-400 w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    {plan.features?.priority_support ? (
                      <FiCheck className="text-emerald-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <FiX className="text-red-400 w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <span>Priority support</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100">
                <button
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-xs flex items-center justify-center gap-1.5"
                >
                  Subscribe (₹{plan.price})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Plans;
