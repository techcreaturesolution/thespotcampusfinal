import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const CreatePlanModal = ({ isOpen, onClose, plan, onSubmit }) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    plan_for: "company",
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
        },
      });
    } else {
      setForm({
        plan_for: "company",
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
    }
  }, [plan]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, price: Number(form.price) });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {plan ? "Edit Plan" : "Create New Plan"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
              value={form.plan_name}
              onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
              rows="2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan For</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 bg-white"
              value={form.plan_for}
              onChange={(e) => setForm({ ...form, plan_for: e.target.value })}
              required
            >
              <option value="company">Company</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validity (days)</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
                value={form.validity_days}
                onChange={(e) => setForm({ ...form, validity_days: parseInt(e.target.value) || 30 })}
                min="1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">
                  {form.plan_for === "student" ? "Max Job Applications" : "Max Rounds Per Job"}
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 w-20 text-sm"
                  value={form.features.max_rounds_per_job}
                  onChange={(e) => setForm({ ...form, features: { ...form.features, max_rounds_per_job: parseInt(e.target.value) || 5 } })}
                  min="1"
                  max="1000"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">
                  {form.plan_for === "student" ? "Max Interviews Per Month" : "Max Interviews Per Month"}
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 w-20 text-sm"
                  value={form.features.max_interviews_per_month}
                  onChange={(e) => setForm({ ...form, features: { ...form.features, max_interviews_per_month: parseInt(e.target.value) || 50 } })}
                  min="1"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">
                  {form.plan_for === "student" ? "Video Interview Access & Prep" : "Video Interviews"}
                </label>
                <input
                  type="checkbox"
                  checked={form.features.video_interview_enabled}
                  onChange={(e) => setForm({ ...form, features: { ...form.features, video_interview_enabled: e.target.checked } })}
                  className="rounded border-gray-300 text-primary-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">
                  {form.plan_for === "student" ? "Profile Performance Insights" : "Advanced Analytics"}
                </label>
                <input
                  type="checkbox"
                  checked={form.features.advanced_analytics}
                  onChange={(e) => setForm({ ...form, features: { ...form.features, advanced_analytics: e.target.checked } })}
                  className="rounded border-gray-300 text-primary-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">
                  {form.plan_for === "student" ? "Priority Placement Support" : "Priority Support"}
                </label>
                <input
                  type="checkbox"
                  checked={form.features.priority_support}
                  onChange={(e) => setForm({ ...form, features: { ...form.features, priority_support: e.target.checked } })}
                  className="rounded border-gray-300 text-primary-600"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-5 rounded-lg border border-gray-300 transition-all duration-200 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm"
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
