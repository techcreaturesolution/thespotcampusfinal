import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative">
        <div className="text-center mb-8">
          <Link to={fromAdmin ? "/dashboard/admin/manage-university" : "/"} className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:scale-105 transition duration-200">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-extrabold text-gray-900">The Spot Campus</span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{fromAdmin ? "Add New University" : "University Registration"}</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">{fromAdmin ? "Enter university details below to register it on the platform" : "Register your university to manage affiliated colleges"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">University Name</label>
            <input type="text" name="university_name" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.university_name} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Email Address</label>
              <input type="email" name="university_email" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.university_email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="university_password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl pl-4 pr-10 py-3 text-sm"
                  value={formData.university_password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Contact No</label>
              <input type="tel" name="university_contact_no" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.university_contact_no} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Establishment Year</label>
              <input type="text" name="university_establishment" placeholder="e.g. 1995" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.university_establishment} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Website</label>
            <input type="url" name="university_website" placeholder="https://example.edu.in" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.university_website} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Address</label>
            <textarea name="university_address" rows="3" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.university_address} onChange={handleChange} required />
          </div>

          <button type="submit" className="w-full inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition" disabled={isSubmitting}>
            {isSubmitting ? (fromAdmin ? "Adding..." : "Registering...") : (fromAdmin ? "Add University" : "Register University")}
          </button>
        </form>

        {!fromAdmin && (
          <p className="text-center text-sm text-gray-500 mt-6 font-medium">
            Already registered? <Link to="/sign-in" className="text-primary-600 font-bold hover:underline">Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default SignUpUniversity;
