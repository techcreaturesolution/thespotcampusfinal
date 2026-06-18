import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { FiUser, FiCamera, FiEdit2, FiSave, FiX, FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader";
import customFetch from "../../utils/customFetch";

const Profile = () => {
  const { user, role, reloadUser } = useOutletContext();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // CV Builder Status State
  const [hasCv, setHasCv] = useState(false);

  useEffect(() => {
    if (role === "Student") {
      const checkCvStatus = async () => {
        try {
          const { data } = await customFetch.get("/student/resume/me");
          if (data?.resume?.ai_compiled_html) {
            setHasCv(true);
          }
        } catch (error) {
          console.error("Failed to check CV status", error);
        }
      };
      checkCvStatus();
    }
  }, [role]);

  // Dynamic profile photo resolver
  const profilePhoto =
    user?.admin_image ||
    user?.student_image ||
    user?.company_logo ||
    user?.college_logo ||
    user?.university_logo ||
    user?.tpo_image;

  // Set initial form state dynamically depending on role
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user) {
      setFormData(getInitialData(user, role));
    }
  }, [user, role]);

  const getInitialData = (u, r) => {
    switch (r) {
      case "Admin":
        return { admin_name: u.admin_name || "" };
      case "Student":
        return {
          student_name: u.student_name || "",
          student_contact: u.student_contact || "",
          student_skills: u.student_skills || "",
          student_enrollment: u.student_enrollment || "",
          student_current_sem: u.student_current_sem || "",
          student_total_backlog: u.student_total_backlog || "",
        };
      case "Company":
        return {
          company_name: u.company_name || "",
          company_contact: u.company_contact || "",
          company_address: u.company_address || "",
          company_website: u.company_website || "",
        };
      case "College":
        return {
          college_name: u.college_name || "",
          college_code: u.college_code || "",
          college_contact: u.college_contact || "",
          college_address: u.college_address || "",
          college_website: u.college_website || "",
        };
      case "University":
        return {
          university_name: u.university_name || "",
          university_establishment: u.university_establishment || "",
          university_contact_no: u.university_contact_no || "",
          university_address: u.university_address || "",
          university_website: u.university_website || "",
        };
      case "TPO":
        return {
          tpo_name: u.tpo_name || "",
          tpo_contact: u.tpo_contact || "",
        };
      default:
        return {};
    }
  };

  const displayName =
    user?.student_name ||
    user?.company_name ||
    user?.admin_name ||
    user?.college_name ||
    user?.university_name ||
    user?.tpo_name ||
    "User";

  const email =
    user?.student_email ||
    user?.company_email ||
    user?.admin_email ||
    user?.college_email ||
    user?.university_email ||
    user?.tpo_email ||
    "-";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      if (selectedFile) {
        data.append("profile_image", selectedFile);
      }

      await customFetch.patch("/users/update-profile", data);
      toast.success("Profile updated successfully");
      await reloadUser();
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewImage(null);
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(getInitialData(user, role));
    setPreviewImage(null);
    setSelectedFile(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        icon={FiUser}
        title="Profile"
        subtitle="Manage your personal details, workspace options, and profile photo."
        badge={role}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
          {/* Avatar and Header Card */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-r from-gray-50 to-white">
            <div className="relative group">
              <div className="w-28 h-28 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl font-extrabold text-white shadow-xl shadow-primary-500/10 overflow-hidden border-2 border-white">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                ) : profilePhoto ? (
                  <img src={profilePhoto} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  (displayName || "U")[0].toUpperCase()
                )}
              </div>
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <FiCamera className="text-white w-6 h-6" />
                </label>
              )}
            </div>
            <div className="text-center sm:text-left flex-1 space-y-1.5">
              <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
                  {role}
                </span>
                <span className="text-sm text-gray-500">{email}</span>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                <FiEdit2 className="w-4 h-4" /> Edit Profile
              </button>
            )}
          </div>

          {/* Form Fields Card */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Common Email (Always Read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Dynamic inputs based on Role */}
              {role === "Admin" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Name</label>
                  <input
                    type="text"
                    name="admin_name"
                    value={formData.admin_name || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                      isEditing
                        ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                        : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                    }`}
                    required
                  />
                </div>
              )}

              {role === "Student" && (
                <>
                  {/* CV status banner */}
                  <div className="col-span-1 md:col-span-2 p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all border-slate-200 shadow-sm bg-gradient-to-r from-indigo-50/50 to-white mb-2">
                    <div className="flex items-center gap-3.5 text-left">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                        hasCv 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-150" 
                          : "bg-amber-50 text-amber-600 border-amber-150"
                      }`}>
                        <FiCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {hasCv ? "CV Generated & Saved to Profile" : "CV Not Saved to Profile"}
                        </h4>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5 leading-normal">
                          {hasCv 
                            ? "Your generated CV is successfully saved in your profile and is ready for job applications." 
                            : "You must generate and save your CV to your profile before applying for jobs."}
                        </p>
                      </div>
                    </div>
                    {hasCv ? (
                      <Link
                        to="/dashboard/student/ai-cv-builder"
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] border border-indigo-200/50 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs shrink-0 active:scale-95 text-center"
                      >
                        Edit CV
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard/student/ai-cv-builder"
                        className="px-4 py-2 bg-[#3730a3] hover:bg-[#2e288a] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0 active:scale-95 text-center"
                      >
                        Create CV Now
                      </Link>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</label>
                    <input
                      type="text"
                      name="student_name"
                      value={formData.student_name || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</label>
                    <input
                      type="text"
                      name="student_contact"
                      value={formData.student_contact || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrollment No.</label>
                    <input
                      type="text"
                      name="student_enrollment"
                      value={formData.student_enrollment || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">University</label>
                    <input
                      type="text"
                      value={user?.university_id?.university_name || "—"}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">College</label>
                    <input
                      type="text"
                      value={user?.college_id?.college_name || "—"}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Degree</label>
                    <input
                      type="text"
                      value={user?.degree_id?.degree_name || "—"}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</label>
                    <input
                      type="text"
                      value={user?.branch_id?.branch_name || "—"}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Semester</label>
                    <input
                      type="text"
                      name="student_current_sem"
                      value={formData.student_current_sem || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Backlogs</label>
                    <input
                      type="text"
                      name="student_total_backlog"
                      value={formData.student_total_backlog || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Skills (Comma Separated)</label>
                    <input
                      type="text"
                      name="student_skills"
                      placeholder="e.g. React, Node.js, Python, CSS"
                      value={formData.student_skills || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </>
              )}

              {role === "Company" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</label>
                    <input
                      type="text"
                      name="company_contact"
                      value={formData.company_contact || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Website URL</label>
                    <input
                      type="url"
                      name="company_website"
                      placeholder="https://example.com"
                      value={formData.company_website || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Address</label>
                    <textarea
                      name="company_address"
                      rows="3"
                      value={formData.company_address || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </>
              )}

              {role === "College" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">College Name</label>
                    <input
                      type="text"
                      name="college_name"
                      value={formData.college_name || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Affiliated University</label>
                    <input
                      type="text"
                      value={user?.college_university_id?.university_name || "—"}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">College Code</label>
                    <input
                      type="text"
                      name="college_code"
                      value={formData.college_code || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</label>
                    <input
                      type="text"
                      name="college_contact"
                      value={formData.college_contact || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Website URL</label>
                    <input
                      type="url"
                      name="college_website"
                      placeholder="https://example.com"
                      value={formData.college_website || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">College Address</label>
                    <textarea
                      name="college_address"
                      rows="3"
                      value={formData.college_address || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </>
              )}

              {role === "University" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">University Name</label>
                    <input
                      type="text"
                      name="university_name"
                      value={formData.university_name || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Establishment Year</label>
                    <input
                      type="text"
                      name="university_establishment"
                      value={formData.university_establishment || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</label>
                    <input
                      type="text"
                      name="university_contact_no"
                      value={formData.university_contact_no || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Website URL</label>
                    <input
                      type="url"
                      name="university_website"
                      placeholder="https://example.com"
                      value={formData.university_website || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">University Address</label>
                    <textarea
                      name="university_address"
                      rows="3"
                      value={formData.university_address || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </>
              )}

              {role === "TPO" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">TPO Name</label>
                    <input
                      type="text"
                      name="tpo_name"
                      value={formData.tpo_name || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Number</label>
                    <input
                      type="text"
                      name="tpo_contact"
                      value={formData.tpo_contact || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        isEditing
                          ? "bg-white border-gray-300 text-gray-900 focus:border-primary-500"
                          : "bg-gray-50 border-gray-200 text-gray-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">College</label>
                    <input
                      type="text"
                      value={user?.tpo_college_id?.college_name || "—"}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">University</label>
                    <input
                      type="text"
                      value={user?.tpo_college_id?.college_university_id?.university_name || "—"}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Degree</label>
                    <input
                      type="text"
                      value={user?.tpo_degree_id?.degree_name || "—"}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Editing Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  <FiX className="w-4 h-4" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:shadow-primary-500/10 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiSave className="w-4 h-4" />
                  )}
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
