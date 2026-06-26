import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff, FiArrowLeft, FiUser, FiMail, FiLock, FiPhone, FiMapPin, FiGlobe, FiBriefcase, FiShield } from "react-icons/fi";
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
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-[#3730a3] selection:text-white">
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Form Card Container */}
      <div className="max-w-lg w-full glass-panel rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-indigo-950/5 relative border border-white/60 glow-soft mt-12 mb-8 bg-white/80 backdrop-blur-xl">
        {/* Back Button */}
        <Link
          to={fromAdmin ? "/dashboard/admin/manage-college" : "/"}
          className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-300 text-slate-500 hover:text-[#3730a3] transition-all duration-200 shadow-sm"
          title="Back"
          aria-label="Back"
        >
          <FiArrowLeft className="w-4.5 h-4.5" />
        </Link>

        <div className="text-center mb-8">
          <Link to={fromAdmin ? "/dashboard/admin/manage-college" : "/"} className="inline-flex items-center justify-center mb-4 p-2 bg-white rounded-2xl shadow-sm border border-slate-100/50">
            <img src="/logo_TSC.webp" alt="The Spot Campus" width="130" height="40" className="h-10 object-contain" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {fromAdmin ? "Add New " : ""}<span className="text-gradient font-black">College</span>{fromAdmin ? "" : " Registration"}
          </h1>
          <p className="text-slate-600 mt-1.5 font-semibold text-xs sm:text-sm">
            {fromAdmin ? "Enter college details below to register it on the platform" : "Register your college under your affiliated university"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Affiliated University */}
          <div>
            <label htmlFor="college_university_id" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Affiliated University</label>
            <div className="relative">
              <select id="college_university_id" name="college_university_id" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5 bg-white appearance-none" value={formData.college_university_id} onChange={handleChange} required>
                <option value="">Select University</option>
                {universities.map((u) => <option key={u._id} value={u._id}>{u.university_name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* College Name */}
            <div>
              <label htmlFor="college_name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">College Name</label>
              <div className="relative">
                <FiBriefcase className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input id="college_name" type="text" name="college_name" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5" value={formData.college_name} onChange={handleChange} required />
              </div>
            </div>

            {/* College Code */}
            <div>
              <label htmlFor="college_code" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">College Code</label>
              <div className="relative">
                <FiShield className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input id="college_code" type="text" name="college_code" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5" value={formData.college_code} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Email Address */}
            <div>
              <label htmlFor="college_email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input id="college_email" type="email" name="college_email" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5" value={formData.college_email} onChange={handleChange} required />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="college_password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input
                  id="college_password"
                  type={showPassword ? "text" : "password"}
                  name="college_password"
                  className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-10 focus:ring-4 focus:ring-indigo-500/5"
                  value={formData.college_password}
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
              <label htmlFor="college_contact" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Contact Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input id="college_contact" type="tel" name="college_contact" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5" value={formData.college_contact} onChange={handleChange} required />
              </div>
            </div>

            {/* Website */}
            <div>
              <label htmlFor="college_website" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Website</label>
              <div className="relative">
                <FiGlobe className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
                <input id="college_website" type="url" name="college_website" placeholder="https://examplecollege.edu" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5" value={formData.college_website} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="college_address" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Address</label>
            <div className="relative">
              <FiMapPin className="absolute left-3.5 top-3.5 text-[#3730a3] w-4.5 h-4.5" />
              <textarea id="college_address" name="college_address" rows="2" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-10 pr-4 focus:ring-4 focus:ring-indigo-500/5 resize-none" value={formData.college_address} onChange={handleChange} required />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 vibrant-btn text-white font-bold text-sm rounded-xl active:scale-97 transition-all tracking-wider uppercase shadow-md hover:shadow-lg focus:outline-none disabled:opacity-75"
            disabled={isSubmitting}
          >
            {isSubmitting ? (fromAdmin ? "Adding..." : "Registering...") : (fromAdmin ? "Add College" : "Register College")}
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

export default SignUpCollege;
