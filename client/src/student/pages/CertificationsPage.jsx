import React from "react";
import { useOutletContext } from "react-router-dom";
import { FiAward } from "react-icons/fi";
import PageHeader from "../../common/components/PageHeader";
import CertificationsSection from "../../common/components/CertificationsSection";

const CertificationsPage = () => {
  const { role, reloadUser } = useOutletContext() || {};

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      <PageHeader
        icon={FiAward}
        title="Certifications &amp; Credentials"
        subtitle="Manage your verified-format technical, cloud, academic, and industry certifications."
        badge={role || "Student"}
      />
      <CertificationsSection role={role || "Student"} canEdit={true} onUpdated={reloadUser} />
    </div>
  );
};

export default CertificationsPage;
