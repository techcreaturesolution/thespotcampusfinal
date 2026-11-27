import React from "react";
import { useOutletContext } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
import PageHeader from "../../common/components/PageHeader";
import ResumeVersionsSection from "../../common/components/ResumeVersionsSection";
import ResumeDocumentsSection from "../../common/components/ResumeDocumentsSection";

const ResumeVersionsPage = () => {
  const { role } = useOutletContext() || {};

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-8">
      <PageHeader
        icon={FiFileText}
        title="Multiple Resume Versions"
        subtitle="Manage tailored resume configurations built directly from your canonical profile."
        badge={role || "Student"}
      />
      <ResumeVersionsSection role={role || "Student"} canEdit={true} />
      <div className="pt-4 border-t border-slate-200">
        <ResumeDocumentsSection
          role={role || "Student"}
          canEdit={true}
          defaultType="RESUME"
          compact={true}
        />
      </div>
    </div>
  );
};

export default ResumeVersionsPage;
