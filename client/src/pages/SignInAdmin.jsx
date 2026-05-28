import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiShield } from "react-icons/fi";
import customFetch from "../utils/customFetch";

const SignInAdmin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ admin_email: "", admin_password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await customFetch.post("/auth/login", formData);
      toast.success("Admin login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiShield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-500 mt-1">Access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-gray-400" />
              <input type="email" className="input-field pl-10" placeholder="admin@thespotcampus.com" value={formData.admin_email} onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" />
              <input type="password" className="input-field pl-10" placeholder="Enter admin password" value={formData.admin_password} onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })} required />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Admin Sign In"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/sign-in" className="text-sm text-gray-500 hover:text-primary-600">Back to User Login</Link>
        </div>
      </div>
    </div>
  );
};

export default SignInAdmin;
