import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiTrash2, FiGrid, FiCheck, FiX } from "react-icons/fi";
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

const ManageUniversity = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await customFetch.get("/university");
      setUniversities(data.universitys || []);
    } catch {
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await customFetch.patch(`/university/${id}/status/${status}`);
      toast.success(`University ${status.toLowerCase()}`);
      fetchData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this university?")) return;
    try {
      await customFetch.delete(`/university/${id}`);
      toast.success("University deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const pendingCount = universities.filter((u) => getStatusText(u.university_verified) === "Pending").length;

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiGrid}
        title="Universities"
        subtitle="Manage registered university accounts across the platform."
        badge={pendingCount > 0 ? `${pendingCount} pending` : `${universities.length} total`}
        action={
          <Link
            to="/sign-up-university"
            state={{ fromAdmin: true }}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md inline-flex items-center gap-2 text-sm"
          >
            Add University
          </Link>
        }
      />
      <DataTable
        data={universities}
        searchKeys={["university_name", "university_email"]}
        searchPlaceholder="Search by name or email…"
        emptyMessage="No universities registered yet"
        columns={[
          {
            key: "name",
            label: "University",
            render: (u) => (
              <div>
                <p className="font-semibold text-slate-900">{u.university_name}</p>
              </div>
            ),
          },
          {
            key: "email",
            label: "Email",
            render: (u) => u.university_email,
          },
          {
            key: "status",
            label: "Status",
            render: (u) => (
              <span className={statusBadge(u.university_verified)}>
                {getStatusText(u.university_verified)}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "w-36",
            render: (u) => (
              <div className="flex gap-1">
                {getStatusText(u.university_verified) !== "Approved" && (
                  <>
                    <IconButton variant="success" title="Approve" onClick={() => handleStatus(u._id, "Approved")}>
                      <FiCheck className="w-4 h-4" />
                    </IconButton>
                    <IconButton variant="danger" title="Reject" onClick={() => handleStatus(u._id, "Rejected")}>
                      <FiX className="w-4 h-4" />
                    </IconButton>
                  </>
                )}
                <IconButton variant="neutral" title="Delete" onClick={() => handleDelete(u._id)}>
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

export default ManageUniversity;
