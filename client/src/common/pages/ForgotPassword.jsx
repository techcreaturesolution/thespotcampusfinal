import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await customFetch.post("/auth/forgot-password", { email });
      toast.success(response?.data?.msg || "Reset email sent successfully!");
      setSubmitted(true);
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#3730a3] selection:text-white">
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Card Container */}
      <div className="max-w-md w-full glass-panel rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-indigo-950/5 relative border border-white/60 glow-soft mt-12 mb-8 bg-white/80 backdrop-blur-xl">
        {/* Back Button */}
        <Link
          to="/sign-in"
          className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-300 text-slate-500 hover:text-[#3730a3] transition-all duration-200 shadow-sm"
          title="Back to Sign In"
        >
          <FiArrowLeft className="w-4 h-4" />
        </Link>

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-5 p-2 bg-white rounded-2xl shadow-sm border border-slate-100/50">
            <img src="/logo_TSC.png" alt="The Spot Campus" width="130" height="40" className="h-10 object-contain" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Forgot <span className="text-gradient font-black">Password?</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 font-semibold">
            No worries, we will send you instructions to reset your password.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 vibrant-btn text-white font-bold text-sm rounded-xl active:scale-97 transition-all tracking-wider uppercase shadow-md hover:shadow-lg focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending Link..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4 animate-scale-in">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mx-auto">
              <FiCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Check Your Email</h3>
            <p className="text-slate-600 text-xs sm:text-sm font-semibold max-w-sm mx-auto leading-relaxed">
              If an account matches <span className="text-[#3730a3] font-bold">{email}</span>, we have sent a secure link to reset your password.
            </p>
            <div className="pt-4">
              <Link
                to="/sign-in"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#3730a3] hover:underline"
              >
                <FiArrowLeft className="w-3.5 h-3.5" /> Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ForgotPassword;
