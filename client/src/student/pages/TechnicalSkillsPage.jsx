import React from "react";
import { useOutletContext } from "react-router-dom";
import { FiCpu } from "react-icons/fi";
import PageHeader from "../../common/components/PageHeader";
import TechnicalSkillsSection from "../../common/components/TechnicalSkillsSection";

const TechnicalSkillsPage = () => {
  const { role, reloadUser } = useOutletContext() || {};

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      <PageHeader
        icon={FiCpu}
        title="Technical Skills"
        subtitle="Maintain your structured technical skills profile with standardized categories and proficiency levels."
        badge={role || "Student"}
      />
      <TechnicalSkillsSection role={role || "Student"} canEdit={true} onUpdated={reloadUser} />
    </div>
  );
};

export default TechnicalSkillsPage;
