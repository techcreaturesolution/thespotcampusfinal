import React from "react";
import { useOutletContext } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
import PageHeader from "../../common/components/PageHeader";
import ResumeDocumentsSection from "../../common/components/ResumeDocumentsSection";

const DocumentsPage = () => {
  const { role } = useOutletContext() || {};

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      <PageHeader
        icon={FiFileText}
        title="Resume Files &amp; Documents"
        subtitle="Upload, replace, organize, and link private resume documents securely."
        badge={role || "Student"}
      />
      <ResumeDocumentsSection role={role || "Student"} canEdit={true} />
    </div>
  );
};

export default DocumentsPage;
