import React, { useEffect, useState } from "react";
import { FiX, FiBookOpen } from "react-icons/fi";
import AcademicProfileSection from "./AcademicProfileSection";
import TechnicalSkillsSection from "./TechnicalSkillsSection";
import ProjectsSection from "./ProjectsSection";
import CertificationsSection from "./CertificationsSection";
import InternshipsSection from "./InternshipsSection";
import ResumeDocumentsSection from "./ResumeDocumentsSection";
import ProfileCompletenessCard from "./ProfileCompletenessCard";
import ProfileValidationVisibilityCard from "./ProfileValidationVisibilityCard";

const AcademicProfileModal = ({ student, role, onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState("academic");
  const [completenessRefreshKey, setCompletenessRefreshKey] = useState(0);

  const handleChildUpdated = (...args) => {
    setCompletenessRefreshKey((k) => k + 1);
    if (onUpdated) onUpdated(...args);
  };

  useEffect(() => {
    setActiveTab("academic");
  }, [student?._id]);

  useEffect(() => {
    if (!student) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [student, onClose]);

  if (!student) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Student Academic Profile"
    >
      <div className="bg-[#f8f9ff] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#3730a3] flex items-center justify-center">
              <FiBookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Academic Profile — {student.student_name}
              </h2>
              <p className="text-xs text-slate-500">{student.student_email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-3 bg-white border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("academic")}
            className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
              activeTab === "academic"
                ? "border-[#3730a3] text-[#3730a3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Academic Profile &amp; History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("skills")}
            className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
              activeTab === "skills"
                ? "border-[#3730a3] text-[#3730a3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Technical Skills
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
              activeTab === "projects"
                ? "border-[#3730a3] text-[#3730a3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("certifications")}
            className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
              activeTab === "certifications"
                ? "border-[#3730a3] text-[#3730a3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Certifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("internships")}
            className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
              activeTab === "internships"
                ? "border-[#3730a3] text-[#3730a3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Internships
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
              activeTab === "documents"
                ? "border-[#3730a3] text-[#3730a3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Documents
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completeness")}
            className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
              activeTab === "completeness"
                ? "border-[#3730a3] text-[#3730a3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Completeness
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("policy")}
            className={`px-3.5 py-2 text-xs font-extrabold border-b-2 transition-colors ${
              activeTab === "policy"
                ? "border-[#3730a3] text-[#3730a3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Validation &amp; Visibility
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          {activeTab === "policy" ? (
            <ProfileValidationVisibilityCard
              studentId={student._id}
              role={role}
              refreshKey={completenessRefreshKey}
              onPolicyUpdated={handleChildUpdated}
            />
          ) : activeTab === "completeness" ? (
            <ProfileCompletenessCard
              studentId={student._id}
              refreshKey={completenessRefreshKey}
              showActionLinks={false}
              compact
            />
          ) : activeTab === "academic" ? (
            <AcademicProfileSection
              studentId={student._id}
              role={role}
              canEdit={role !== "University"}
              onUpdated={handleChildUpdated}
              compact
            />
          ) : activeTab === "skills" ? (
            <TechnicalSkillsSection
              studentId={student._id}
              role={role}
              canEdit={role !== "University"}
              onUpdated={handleChildUpdated}
              compact
            />
          ) : activeTab === "projects" ? (
            <ProjectsSection
              studentId={student._id}
              role={role}
              canEdit={role !== "University"}
              onUpdated={handleChildUpdated}
              compact
            />
          ) : activeTab === "certifications" ? (
            <CertificationsSection
              studentId={student._id}
              role={role}
              canEdit={role !== "University"}
              onUpdated={handleChildUpdated}
              compact
            />
          ) : activeTab === "internships" ? (
            <InternshipsSection
              studentId={student._id}
              role={role}
              canEdit={role !== "University"}
              onUpdated={handleChildUpdated}
              compact
            />
          ) : (
            <ResumeDocumentsSection
              studentId={student._id}
              role={role}
              canEdit={role !== "University"}
              compact
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicProfileModal;
