import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiTrash2, FiCheck, FiX, FiBriefcase } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import IconButton from "../../common/components/IconButton";

const getStatusText = (status) => {
  if (status === "0" || !status) return "Pending";
  return status;
};

const statusBadge = (status) => {
  const text = getStatusText(status);
  if (text === "Approved") return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800";
  if (text === "Rejected") return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";
  return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800";
};

const ManageCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await customFetch.get("/company");
      setCompanies(data.companys || []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await customFetch.patch(`/company/${id}/status/${status}`);
      toast.success(`Company ${status.toLowerCase()}`);
      fetchData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this company?")) return;
    try {
      await customFetch.delete(`/company/${id}`);
      toast.success("Company deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const pendingCount = companies.filter((c) => getStatusText(c.company_verified) === "Pending").length;

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiBriefcase}
        title="Companies"
        subtitle="Approve or reject recruiter accounts before they can post jobs."
        badge={pendingCount > 0 ? `${pendingCount} pending` : `${companies.length} total`}
        action={
          <Link
            to="/sign-up-company"
            state={{ fromAdmin: true }}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md inline-flex items-center gap-2 text-sm"
          >
            Add Company
          </Link>
        }
      />
      <DataTable
        data={companies}
        searchKeys={["company_name", "company_email", "company_contact"]}
        searchPlaceholder="Search companies…"
        emptyMessage="No companies registered"
        columns={[
          {
            key: "name",
            label: "Company",
            render: (c) => <span className="font-semibold text-slate-900">{c.company_name}</span>,
          },
          { key: "email", label: "Email", render: (c) => c.company_email },
          { key: "contact", label: "Contact", render: (c) => c.company_contact || "—" },
          {
            key: "status",
            label: "Status",
            render: (c) => (
              <span className={statusBadge(c.company_verified)}>
                {getStatusText(c.company_verified)}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "w-36",
            render: (c) => (
              <div className="flex gap-1">
                {getStatusText(c.company_verified) !== "Approved" && (
                  <>
                    <IconButton variant="success" title="Approve" onClick={() => handleStatus(c._id, "Approved")}>
                      <FiCheck className="w-4 h-4" />
                    </IconButton>
                    <IconButton variant="danger" title="Reject" onClick={() => handleStatus(c._id, "Rejected")}>
                      <FiX className="w-4 h-4" />
                    </IconButton>
                  </>
                )}
                <IconButton variant="neutral" title="Delete" onClick={() => handleDelete(c._id)}>
                  <FiTrash2 className="w-4 h-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ManageCompany;
