import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const SignUpCollege = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromAdmin = location.state?.fromAdmin;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [formData, setFormData] = useState({
    college_university_id: "", college_code: "", college_name: "", college_email: "",
    college_address: "", college_contact: "", college_website: "", college_password: "",
  });

  useEffect(() => {
    customFetch.get("/dropdown/universities")
      .then(({ data }) => setUniversities(data.universities || []))
      .catch(() => toast.error("Failed to load universities"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await customFetch.post("/college", formData);
      toast.success(fromAdmin ? "College added successfully" : "College registered successfully! Awaiting verification.");
      if (fromAdmin) {
        navigate("/dashboard/admin/manage-college");
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
          <Link to={fromAdmin ? "/dashboard/admin/manage-college" : "/"} className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:scale-105 transition duration-200">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-extrabold text-gray-900">The Spot Campus</span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{fromAdmin ? "Add New College" : "College Registration"}</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">{fromAdmin ? "Enter college details below to register it on the platform" : "Register your college under your affiliated university"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Affiliated University</label>
              <select name="college_university_id" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm bg-white" value={formData.college_university_id} onChange={handleChange} required>
                <option value="">Select University</option>
                {universities.map((u) => <option key={u._id} value={u._id}>{u.university_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">College Name</label>
              <input type="text" name="college_name" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.college_name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">College Code</label>
              <input type="text" name="college_code" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.college_code} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Email Address</label>
              <input type="email" name="college_email" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.college_email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="college_password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl pl-4 pr-10 py-3 text-sm"
                  value={formData.college_password}
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
              <input type="tel" name="college_contact" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.college_contact} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Website</label>
              <input type="url" name="college_website" placeholder="https://examplecollege.edu" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.college_website} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Address</label>
            <textarea name="college_address" rows="3" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.college_address} onChange={handleChange} required />
          </div>

          <button type="submit" className="w-full inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition" disabled={isSubmitting}>
            {isSubmitting ? (fromAdmin ? "Adding..." : "Registering...") : (fromAdmin ? "Add College" : "Register College")}
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

export default SignUpCollege;
