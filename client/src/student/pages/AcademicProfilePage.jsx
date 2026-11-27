import React from "react";
import { useOutletContext } from "react-router-dom";
import { FiBookOpen } from "react-icons/fi";
import PageHeader from "../../common/components/PageHeader";
import AcademicProfileSection from "../../common/components/AcademicProfileSection";

const AcademicProfilePage = () => {
  const { role, reloadUser } = useOutletContext() || {};

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      <PageHeader
        icon={FiBookOpen}
        title="Academic Profile"
        subtitle="Manage your institutional details, academic progress, and verified educational history."
        badge={role || "Student"}
      />
      <AcademicProfileSection role={role || "Student"} canEdit={true} onUpdated={reloadUser} />
    </div>
  );
};

export default AcademicProfilePage;
