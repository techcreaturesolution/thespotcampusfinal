import React from "react";
import { useOutletContext } from "react-router-dom";
import { FiLayers } from "react-icons/fi";
import PageHeader from "../../common/components/PageHeader";
import ProjectsSection from "../../common/components/ProjectsSection";

const ProjectsPage = () => {
  const { role, reloadUser } = useOutletContext() || {};

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      <PageHeader
        icon={FiLayers}
        title="Projects Portfolio"
        subtitle="Manage your academic, personal, and team projects linked with canonical technical skills."
        badge={role || "Student"}
      />
      <ProjectsSection role={role || "Student"} canEdit={true} onUpdated={reloadUser} />
    </div>
  );
};

export default ProjectsPage;
