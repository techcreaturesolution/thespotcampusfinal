import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import SEO from "../components/SEO";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await customFetch.post("/auth/reset-password", { token, password });
      toast.success(response?.data?.msg || "Password reset successful!");
      setResetSuccess(true);
      setTimeout(() => {
        navigate("/sign-in");
      }, 3000);
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Reset failed. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#3730a3] selection:text-white">
      <SEO 
        title="Reset Password"
        description="Set a new password for your account on The Spot Campus."
        keywords="reset password, update credentials, change password"
        canonical="https://thespotcampus.com/reset-password"
      />
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Card Container */}
      <div className="max-w-md w-full glass-panel rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-indigo-950/5 relative border border-white/60 glow-soft mt-12 mb-8 bg-white/80 backdrop-blur-xl">
        
        {/* Back Button */}
        {!resetSuccess && (
          <Link
            to="/sign-in"
            className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-300 text-slate-500 hover:text-[#3730a3] transition-all duration-200 shadow-sm"
            title="Back to Sign In"
          >
            <FiArrowLeft className="w-4 h-4" />
          </Link>
        )}

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-5 p-2 bg-white rounded-2xl shadow-sm border border-slate-100/50">
            <img src="/logo_TSC.png" alt="The Spot Campus" width="130" height="40" className="h-10 object-contain" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Reset <span className="text-gradient font-black">Password</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 font-semibold">
            Choose a strong, secure password for your account.
          </p>
        </div>

        {!resetSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-10 focus:ring-4 focus:ring-indigo-500/5"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-1 top-1 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-[#3730a3] focus:outline-none transition duration-150"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-10 focus:ring-4 focus:ring-indigo-500/5"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-1 top-1 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-[#3730a3] focus:outline-none transition duration-150"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 vibrant-btn text-white font-bold text-sm rounded-xl active:scale-97 transition-all tracking-wider uppercase shadow-md hover:shadow-lg focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4 animate-scale-in">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mx-auto">
              <FiCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Password Updated!</h3>
            <p className="text-slate-600 text-xs sm:text-sm font-semibold max-w-sm mx-auto leading-relaxed">
              Your password has been successfully updated. You are being redirected to the Login page.
            </p>
            <div className="pt-4">
              <Link
                to="/sign-in"
                className="vibrant-btn text-white font-bold text-xs px-6 py-2.5 rounded-xl active:scale-95 transition inline-block"
              >
                Go to Sign In Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ResetPassword;
