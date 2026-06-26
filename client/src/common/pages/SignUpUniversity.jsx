import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff, FiArrowLeft, FiUser, FiMail, FiLock, FiPhone, FiMapPin, FiGlobe, FiCalendar } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const SignUpUniversity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromAdmin = location.state?.fromAdmin;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    university_name: "", university_email: "", university_password: "",
    university_establishment: "", university_address: "", university_contact_no: "", university_website: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await customFetch.post("/university", formData);
      toast.success(fromAdmin ? "University added successfully" : "University registered successfully! Awaiting verification.");
      if (fromAdmin) {
        navigate("/dashboard/admin/manage-university");
      } else {
        navigate("/sign-in");
      }
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-[#3730a3] selection:text-white">
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Form Card Container */}
      <div className="max-w-lg w-full glass-panel rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-indigo-950/5 relative border border-white/60 glow-soft mt-12 mb-8 bg-white/80 backdrop-blur-xl">
        {/* Back Button */}
        <Link
          to={fromAdmin ? "/dashboard/admin/manage-university" : "/"}
          className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-300 text-slate-500 hover:text-[#3730a3] transition-all duration-200 shadow-sm"
          title="Back"
        >
          <FiArrowLeft className="w-4 h-4" />
        </Link>

        <div className="text-center mb-8">
          <Link to={fromAdmin ? "/dashboard/admin/manage-university" : "/"} className="inline-flex items-center justify-center mb-4 p-2 bg-white rounded-2xl shadow-sm border border-slate-100/50">
            <img src="/logo_TSC.webp" alt="The Spot Campus" width="130" height="40" className="h-10 object-contain" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {fromAdmin ? "Add New " : ""}<span className="text-gradient font-black">University</span>{fromAdmin ? "" : " Registration"}
          </h1>
          <p className="text-slate-600 mt-1.5 font-semibold text-xs sm:text-sm">
            {fromAdmin ? "Enter university details below to register it on the platform" : "Register your university to manage affiliated colleges"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* University Name */}
          <div>
            <label htmlFor="university_name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">University Name</label>
            <div className="relative">
              <FiUser className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
              <input id="university_name" type="text" name="university_name" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5" value={formData.university_name} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Email Address */}
            <div>
              <label htmlFor="university_email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input id="university_email" type="email" name="university_email" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5" value={formData.university_email} onChange={handleChange} required />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="university_password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input
                  id="university_password"
                  type={showPassword ? "text" : "password"}
                  name="university_password"
                  className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-10 focus:ring-4 focus:ring-indigo-500/5"
                  value={formData.university_password}
                  onChange={handleChange}
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
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Contact No */}
            <div>
              <label htmlFor="university_contact_no" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Contact Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input id="university_contact_no" type="tel" name="university_contact_no" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5" value={formData.university_contact_no} onChange={handleChange} required />
              </div>
            </div>

            {/* Establishment Year */}
            <div>
              <label htmlFor="university_establishment" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Establishment Year</label>
              <div className="relative">
                <FiCalendar className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input id="university_establishment" type="text" name="university_establishment" placeholder="e.g. 1995" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5" value={formData.university_establishment} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="university_website" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Website</label>
            <div className="relative">
              <FiGlobe className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
              <input id="university_website" type="url" name="university_website" placeholder="https://example.edu.in" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5" value={formData.university_website} onChange={handleChange} />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="university_address" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Address</label>
            <div className="relative">
              <FiMapPin className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
              <textarea id="university_address" name="university_address" rows="2" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5 resize-none" value={formData.university_address} onChange={handleChange} required />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 vibrant-btn text-white font-bold text-sm rounded-xl active:scale-97 transition-all tracking-wider uppercase shadow-md hover:shadow-lg focus:outline-none disabled:opacity-75"
            disabled={isSubmitting}
          >
            {isSubmitting ? (fromAdmin ? "Adding..." : "Registering...") : (fromAdmin ? "Add University" : "Register University")}
          </button>
        </form>

        {!fromAdmin && (
          <p className="text-center text-sm text-slate-500 mt-6 font-semibold">
            Already registered? <Link to="/sign-in" className="text-[#3730a3] font-bold hover:underline">Sign In</Link>
          </p>
        )}
      </div>
    </main>
  );
};

export default SignUpUniversity;
