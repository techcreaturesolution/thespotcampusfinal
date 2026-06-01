import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FiUser, FiMail, FiLock, FiPhone, FiBook, FiCpu, FiEye, FiEyeOff } from "react-icons/fi";
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative">
        <div className="text-center mb-8">
          <Link to={fromAdmin ? "/dashboard/admin/manage-student" : "/"} className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:scale-105 transition duration-200">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-extrabold text-gray-900">The Spot Campus</span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{fromAdmin ? "Add New Student" : "Student Registration"}</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">{fromAdmin ? "Enter student details below to register them on the platform" : "Create your student profile to start applying"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Full Name</label>
              <input type="text" name="student_name" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.student_name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Email Address</label>
              <input type="email" name="student_email" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.student_email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="student_password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl pl-4 pr-10 py-3 text-sm"
                  value={formData.student_password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Contact Number</label>
              <input type="tel" name="student_contact" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.student_contact} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Enrollment Number</label>
              <input type="text" name="student_enrollment" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.student_enrollment} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">University</label>
              <select name="university_id" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm bg-white" value={formData.university_id} onChange={handleChange} required>
                <option value="">Select University</option>
                {universities.map((u) => <option key={u._id} value={u._id}>{u.university_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">College</label>
              <select name="college_id" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm bg-white" value={formData.college_id} onChange={handleChange} disabled={!formData.university_id} required>
                <option value="">Select College</option>
                {colleges.map((c) => <option key={c._id} value={c._id}>{c.college_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Degree</label>
              <select name="degree_id" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm bg-white" value={formData.degree_id} onChange={handleChange} disabled={!formData.college_id} required>
                <option value="">Select Degree</option>
                {degrees.map((d) => <option key={d._id} value={d._id}>{d.degree_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Branch</label>
              <select name="branch_id" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm bg-white" value={formData.branch_id} onChange={handleChange} disabled={!formData.degree_id} required>
                <option value="">Select Branch</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.branch_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Current Semester</label>
              <input type="text" name="student_current_sem" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" value={formData.student_current_sem} onChange={handleChange} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5">Skills</label>
              <input type="text" name="student_skills" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3 text-sm" placeholder="e.g. React, Node.js, Python, Flutter" value={formData.student_skills} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="w-full inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition" disabled={isSubmitting}>
            {isSubmitting ? (fromAdmin ? "Adding..." : "Registering...") : (fromAdmin ? "Add Student" : "Register")}
          </button>
        </form>

        {!fromAdmin && (
          <p className="text-center text-sm text-gray-500 mt-6 font-medium">
            Already have an account? <Link to="/sign-in" className="text-primary-600 font-bold hover:underline">Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default SignUpStudent;
