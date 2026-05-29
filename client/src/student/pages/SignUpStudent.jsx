import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import customFetch from "../../utils/customFetch";

const SignUpStudent = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    }
  }, [formData.university_id]);

  useEffect(() => {
    if (formData.college_id) {
      customFetch.get(`/dropdown/degrees?college_id=${formData.college_id}`).then(({ data }) => setDegrees(data.degrees || []));
    }
  }, [formData.college_id]);

  useEffect(() => {
    if (formData.degree_id) {
      customFetch.get(`/dropdown/branches?degree_id=${formData.degree_id}&college_id=${formData.college_id}`).then(({ data }) => setBranches(data.branches || []));
    }
  }, [formData.degree_id, formData.college_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await customFetch.post("/register", formData);
      toast.success("Registration successful! Please login.");
      navigate("/sign-in");
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">The Spot Campus</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Student Registration</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="student_name" className="input-field" value={formData.student_name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="student_email" className="input-field" value={formData.student_email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="student_password" className="input-field" value={formData.student_password} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <input type="tel" name="student_contact" className="input-field" value={formData.student_contact} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment No</label>
              <input type="text" name="student_enrollment" className="input-field" value={formData.student_enrollment} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
              <select name="university_id" className="input-field" value={formData.university_id} onChange={handleChange} required>
                <option value="">Select University</option>
                {universities.map((u) => <option key={u._id} value={u._id}>{u.university_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
              <select name="college_id" className="input-field" value={formData.college_id} onChange={handleChange} required>
                <option value="">Select College</option>
                {colleges.map((c) => <option key={c._id} value={c._id}>{c.college_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
              <select name="degree_id" className="input-field" value={formData.degree_id} onChange={handleChange} required>
                <option value="">Select Degree</option>
                {degrees.map((d) => <option key={d._id} value={d._id}>{d.degree_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select name="branch_id" className="input-field" value={formData.branch_id} onChange={handleChange} required>
                <option value="">Select Branch</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.branch_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Semester</label>
              <input type="text" name="student_current_sem" className="input-field" value={formData.student_current_sem} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <input type="text" name="student_skills" className="input-field" placeholder="e.g. React, Node.js, Python" value={formData.student_skills} onChange={handleChange} />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/sign-in" className="text-primary-600 font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpStudent;
