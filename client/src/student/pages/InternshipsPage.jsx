import React from "react";
import { useOutletContext } from "react-router-dom";
import { FiBriefcase } from "react-icons/fi";
import PageHeader from "../../common/components/PageHeader";
import InternshipsSection from "../../common/components/InternshipsSection";

const InternshipsPage = () => {
  const { role, reloadUser } = useOutletContext() || {};

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      <PageHeader
        icon={FiBriefcase}
        title="Internship &amp; Work Experience"
        subtitle="Manage your internships and professional work timeline linked with skills and projects."
        badge={role || "Student"}
      />
      <InternshipsSection role={role || "Student"} canEdit={true} onUpdated={reloadUser} />
    </div>
  );
};

export default InternshipsPage;
