import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FiUser, FiMail, FiLock, FiPhone, FiBook, FiCpu, FiEye, FiEyeOff, FiArrowLeft, FiShield } from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import customFetch from "../../utils/customFetch";

const SignUpStudent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromAdmin = location.state?.fromAdmin;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    student_name: "", student_email: "", student_password: "", student_contact: "",
    student_enrollment: "", university_id: "", college_id: "", degree_id: "", branch_id: "",
    student_current_sem: "", student_total_backlog: "0", student_skills: "",
  });

  useEffect(() => {
    customFetch.get("/dropdown/universities").then(({ data }) => setUniversities(data.universities || []));
  }, []);

  useEffect(() => {
    if (formData.university_id) {
      customFetch.get(`/dropdown/colleges?university_id=${formData.university_id}`).then(({ data }) => setColleges(data.colleges || []));
    } else {
      setColleges([]);
      setDegrees([]);
      setBranches([]);
    }
  }, [formData.university_id]);

  useEffect(() => {
    if (formData.college_id) {
      customFetch.get(`/dropdown/degrees?college_id=${formData.college_id}`).then(({ data }) => setDegrees(data.degrees || []));
    } else {
      setDegrees([]);
      setBranches([]);
    }
  }, [formData.college_id]);

  useEffect(() => {
    if (formData.degree_id) {
      customFetch.get(`/dropdown/branches?degree_id=${formData.degree_id}&college_id=${formData.college_id}`).then(({ data }) => setBranches(data.branches || []));
    } else {
      setBranches([]);
    }
  }, [formData.degree_id, formData.college_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await customFetch.post("/register", formData);
      toast.success(fromAdmin ? "Student added successfully" : "Student registration successful!");
      if (fromAdmin) {
        navigate("/dashboard/admin/manage-student");
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
      <div className="max-w-2xl w-full glass-panel rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-indigo-950/5 relative border border-white/60 glow-soft mt-12 mb-8 bg-white/80 backdrop-blur-xl">
        {/* Back Button */}
        <Link
          to={fromAdmin ? "/dashboard/admin/manage-student" : "/"}
          className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-300 text-slate-500 hover:text-[#3730a3] transition-all duration-200 shadow-sm"
          title="Back"
        >
          <FiArrowLeft className="w-4 h-4" />
        </Link>

        <div className="text-center mb-8">
          <Link to={fromAdmin ? "/dashboard/admin/manage-student" : "/"} className="inline-flex items-center justify-center mb-4 p-2 bg-white rounded-2xl shadow-sm border border-slate-100/50">
            <img src="/logo_TSC.png" alt="The Spot Campus" width="130" height="40" className="h-10 object-contain" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {fromAdmin ? "Add New " : ""}<span className="text-gradient font-black">Student</span>{fromAdmin ? "" : " Registration"}
          </h1>
          <p className="text-slate-600 mt-1.5 font-semibold text-xs sm:text-sm">
            {fromAdmin ? "Enter student details below to register them on the platform" : "Create your student profile to start applying"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label htmlFor="student_name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Full Name</label>
              <input id="student_name" type="text" name="student_name" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5" value={formData.student_name} onChange={handleChange} required />
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="student_email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
              <input id="student_email" type="email" name="student_email" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5" value={formData.student_email} onChange={handleChange} required />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="student_password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
              <div className="relative">
                <input
                  id="student_password"
                  type={showPassword ? "text" : "password"}
                  name="student_password"
                  className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 pl-4 pr-10 focus:ring-4 focus:ring-indigo-500/5"
                  value={formData.student_password}
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

            {/* Contact Number */}
            <div>
              <label htmlFor="student_contact" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Contact Number</label>
              <input id="student_contact" type="tel" name="student_contact" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5" value={formData.student_contact} onChange={handleChange} required />
            </div>

            {/* Enrollment Number */}
            <div>
              <label htmlFor="student_enrollment" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Enrollment Number</label>
              <input id="student_enrollment" type="text" name="student_enrollment" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5" value={formData.student_enrollment} onChange={handleChange} required />
            </div>

            {/* University */}
            <div>
              <label htmlFor="university_id" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">University</label>
              <div className="relative">
                <select id="university_id" name="university_id" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5 bg-white appearance-none" value={formData.university_id} onChange={handleChange} required>
                  <option value="">Select University</option>
                  {universities.map((u) => <option key={u._id} value={u._id}>{u.university_name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* College */}
            <div>
              <label htmlFor="college_id" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">College</label>
              <div className="relative">
                <select id="college_id" name="college_id" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5 bg-white appearance-none disabled:opacity-60" value={formData.college_id} onChange={handleChange} disabled={!formData.university_id} required>
                  <option value="">Select College</option>
                  {colleges.map((c) => <option key={c._id} value={c._id}>{c.college_name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Degree */}
            <div>
              <label htmlFor="degree_id" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Degree</label>
              <div className="relative">
                <select id="degree_id" name="degree_id" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5 bg-white appearance-none disabled:opacity-60" value={formData.degree_id} onChange={handleChange} disabled={!formData.college_id} required>
                  <option value="">Select Degree</option>
                  {degrees.map((d) => <option key={d._id} value={d._id}>{d.degree_name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Branch */}
            <div>
              <label htmlFor="branch_id" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Branch</label>
              <div className="relative">
                <select id="branch_id" name="branch_id" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5 bg-white appearance-none disabled:opacity-60" value={formData.branch_id} onChange={handleChange} disabled={!formData.degree_id} required>
                  <option value="">Select Branch</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.branch_name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Current Semester */}
            <div>
              <label htmlFor="student_current_sem" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Current Semester</label>
              <input id="student_current_sem" type="text" name="student_current_sem" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5" value={formData.student_current_sem} onChange={handleChange} required />
            </div>

            {/* Skills */}
            <div className="md:col-span-2">
              <label htmlFor="student_skills" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Skills</label>
              <input id="student_skills" type="text" name="student_skills" className="w-full px-4 py-3 bg-[#f8f9ff]/70 border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/5" placeholder="e.g. React, Node.js, Python, Flutter" value={formData.student_skills} onChange={handleChange} />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 vibrant-btn text-white font-bold text-sm rounded-xl active:scale-97 transition-all tracking-wider uppercase shadow-md hover:shadow-lg focus:outline-none disabled:opacity-75"
            disabled={isSubmitting}
          >
            {isSubmitting ? (fromAdmin ? "Adding..." : "Registering...") : (fromAdmin ? "Add Student" : "Register")}
          </button>
        </form>

        {!fromAdmin && (
          <p className="text-center text-sm text-slate-500 mt-6 font-semibold">
            Already have an account? <Link to="/sign-in" className="text-[#3730a3] font-bold hover:underline">Sign In</Link>
          </p>
        )}
      </div>
    </main>
  );
};

export default SignUpStudent;
