import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiUser, FiBriefcase, FiUsers, FiShield } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await customFetch.post("/login", formData);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#3730a3] selection:text-white">
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Form Container Card */}
      <div className="max-w-md w-full glass-panel rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-indigo-950/5 relative border border-white/60 glow-soft mt-12 mb-8 bg-white/80 backdrop-blur-xl">
        {/* Back to Home Icon Button */}
        <Link
          to="/"
          className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-300 text-slate-500 hover:text-[#3730a3] transition-all duration-200 shadow-sm"
          title="Back to Home"
        >
          <FiArrowLeft className="w-4 h-4" />
        </Link>

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-5 p-2 bg-white rounded-2xl shadow-sm border border-slate-100/50">
            <img src="/logo_TSC.png" alt="The Spot Campus" width="130" height="40" className="h-10 object-contain" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome <span className="text-gradient font-black">Back</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 font-semibold">
            Sign in to access your Spot Campus portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
            </div>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-10 focus:ring-4 focus:ring-indigo-500/5"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-[#3730a3] focus:outline-none transition duration-150"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-[#3730a3] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 vibrant-btn text-white font-bold text-sm rounded-xl active:scale-97 transition-all tracking-wider uppercase shadow-md hover:shadow-lg focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Unified Registration Gateway */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4">
            Register New Account
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Student Role */}
            <Link
              to="/sign-up-student"
              className="group flex flex-col items-center p-3 bg-white hover:bg-[#3730a3] border border-slate-100 rounded-xl transition duration-200 shadow-sm hover:shadow-md"
            >
              <FiUser className="w-5 h-5 text-[#3730a3] group-hover:text-white mb-1.5 transition-colors duration-200" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-white transition-colors duration-200">
                As Student
              </span>
            </Link>

            {/* Recruiter Role */}
            <Link
              to="/sign-up-company"
              className="group flex flex-col items-center p-3 bg-white hover:bg-[#3730a3] border border-slate-100 rounded-xl transition duration-200 shadow-sm hover:shadow-md"
            >
              <FiBriefcase className="w-5 h-5 text-[#3730a3] group-hover:text-white mb-1.5 transition-colors duration-200" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-white transition-colors duration-200">
                As Company
              </span>
            </Link>

            {/* University Role */}
            <Link
              to="/sign-up-university"
              className="group flex flex-col items-center p-3 bg-white hover:bg-[#3730a3] border border-slate-100 rounded-xl transition duration-200 shadow-sm hover:shadow-md"
            >
              <FiUsers className="w-5 h-5 text-[#3730a3] group-hover:text-white mb-1.5 transition-colors duration-200" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-white transition-colors duration-200">
                As University
              </span>
            </Link>

            {/* College Role */}
            <Link
              to="/sign-up-college"
              className="group flex flex-col items-center p-3 bg-white hover:bg-[#3730a3] border border-slate-100 rounded-xl transition duration-200 shadow-sm hover:shadow-md"
            >
              <FiShield className="w-5 h-5 text-[#3730a3] group-hover:text-white mb-1.5 transition-colors duration-200" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-white transition-colors duration-200">
                As College
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SignIn;

