import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const CreatePlanModal = ({ isOpen, onClose, plan, onSubmit }) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    plan_for: "student",
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
      cv_builder_enabled: true,
      exam_preparation_enabled: true,
    },
  });

  useEffect(() => {
    if (plan) {
      setForm({
        plan_for: plan.plan_for || "company",
        plan_name: plan.plan_name || "",
        description: plan.description || "",
        price: plan.price || "",
        validity_days: plan.validity_days || 30,
        features: {
          max_rounds_per_job: plan.features?.max_rounds_per_job ?? 5,
          video_interview_enabled: plan.features?.video_interview_enabled ?? true,
          max_interviews_per_month: plan.features?.max_interviews_per_month ?? 50,
          advanced_analytics: plan.features?.advanced_analytics ?? false,
          priority_support: plan.features?.priority_support ?? false,
          cv_builder_enabled: plan.features?.cv_builder_enabled ?? true,
          exam_preparation_enabled: plan.features?.exam_preparation_enabled ?? true,
        },
      });
    } else {
      setForm({
        plan_for: "student",
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
          cv_builder_enabled: true,
          exam_preparation_enabled: true,
        },
      });
    }
  }, [plan]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, price: Number(form.price) });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-100 animate-scale-in text-left">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo_TSC.png" alt="The Spot Campus" className="h-7 object-contain" />
            <span className="text-slate-300">|</span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {plan ? "Edit Recruitment Plan" : "Create New Plan"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-55 hover:text-slate-700 text-slate-400 transition-all duration-200">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Plan Name
            </label>
            <input
              type="text"
              placeholder="e.g. Premium Business Plan"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              value={form.plan_name}
              onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              placeholder="Give a description of the plan benefits..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              rows="2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* plan_for is defaulted to student and dropdown is hidden */}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Price (₹)
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                min="0"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Validity (days)
              </label>
              <input
                type="number"
                placeholder="30"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.validity_days}
                onChange={(e) => setForm({ ...form, validity_days: parseInt(e.target.value) || 30 })}
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 block">
              Features
            </label>
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-600 font-bold">
                  {form.plan_for === "student" ? "Max Job Applications" : "Max Rounds Per Job"}
                </label>
                <input
                  type="number"
                  className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] w-20 text-xs font-extrabold text-slate-850"
                  value={form.features.max_rounds_per_job}
                  onChange={(e) => setForm({ ...form, features: { ...form.features, max_rounds_per_job: parseInt(e.target.value) || 5 } })}
                  min="1"
                  max="1000"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-600 font-bold">
                  Max Interviews Per Month
                </label>
                <input
                  type="number"
                  className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] w-20 text-xs font-extrabold text-slate-850"
                  value={form.features.max_interviews_per_month}
                  onChange={(e) => setForm({ ...form, features: { ...form.features, max_interviews_per_month: parseInt(e.target.value) || 50 } })}
                  min="1"
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="video_interview" className="text-xs text-slate-600 font-bold select-none cursor-pointer">
                  {form.plan_for === "student" ? "Video Interview Access & Prep" : "Video Interviews"}
                </label>
                <input
                  type="checkbox"
                  id="video_interview"
                  checked={form.features.video_interview_enabled}
                  onChange={(e) => setForm({ ...form, features: { ...form.features, video_interview_enabled: e.target.checked } })}
                  className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="adv_analytics" className="text-xs text-slate-600 font-bold select-none cursor-pointer">
                  {form.plan_for === "student" ? "Profile Performance Insights" : "Advanced Analytics"}
                </label>
                <input
                  type="checkbox"
                  id="adv_analytics"
                  checked={form.features.advanced_analytics}
                  onChange={(e) => setForm({ ...form, features: { ...form.features, advanced_analytics: e.target.checked } })}
                  className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="priority_sup" className="text-xs text-slate-600 font-bold select-none cursor-pointer">
                  {form.plan_for === "student" ? "Priority Placement Support" : "Priority Support"}
                </label>
                <input
                  type="checkbox"
                  id="priority_sup"
                  checked={form.features.priority_support}
                  onChange={(e) => setForm({ ...form, features: { ...form.features, priority_support: e.target.checked } })}
                  className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-4 h-4"
                />
              </div>
              {form.plan_for === "student" && (
                <>
                  <div className="flex items-center justify-between">
                    <label htmlFor="cv_builder" className="text-xs text-slate-600 font-bold select-none cursor-pointer">
                      Professional CV Builder & Templates
                    </label>
                    <input
                      type="checkbox"
                      id="cv_builder"
                      checked={form.features.cv_builder_enabled}
                      onChange={(e) => setForm({ ...form, features: { ...form.features, cv_builder_enabled: e.target.checked } })}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="exam_prep" className="text-xs text-slate-600 font-bold select-none cursor-pointer">
                      MCQ & Mock Exam Prep Hub
                    </label>
                    <input
                      type="checkbox"
                      id="exam_prep"
                      checked={form.features.exam_preparation_enabled}
                      onChange={(e) => setForm({ ...form, features: { ...form.features, exam_preparation_enabled: e.target.checked } })}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-4 h-4"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-50 text-slate-700 font-extrabold py-2.5 px-5 rounded-xl border border-slate-200 transition-all duration-200 text-[10px] uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md hover:opacity-95 text-[10px] uppercase tracking-wider"
            >
              {plan ? "Update Plan" : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlanModal;
