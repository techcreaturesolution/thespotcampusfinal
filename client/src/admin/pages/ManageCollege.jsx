import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiTrash2, FiBookOpen, FiCheck, FiX, FiPlus } from "react-icons/fi";
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

const ManageCollege = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await customFetch.get("/college");
      setColleges(data.colleges || []);
    } catch {
      setColleges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await customFetch.patch(`/college/${id}/status/${status}`);
      toast.success(`College ${status.toLowerCase()}`);
      fetchData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this college?")) return;
    try {
      await customFetch.delete(`/college/${id}`);
      toast.success("College deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const pendingCount = colleges.filter((c) => getStatusText(c.college_verified) === "Pending").length;

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiBookOpen}
        title="Colleges"
        subtitle="View and manage college accounts linked to universities."
        badge={pendingCount > 0 ? `${pendingCount} pending` : `${colleges.length} total`}
        action={
          <Link
            to="/sign-up-college"
            state={{ fromAdmin: true }}
            className="vibrant-btn text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 hover:opacity-95 active:scale-95 inline-flex items-center gap-2 text-sm shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20"
          >
            <FiPlus className="w-4 h-4" /> Add College
          </Link>
        }
      />
      <DataTable
        data={colleges}
        searchKeys={["college_name", "college_email", "college_university_id.university_name"]}
        searchPlaceholder="Search colleges…"
        emptyMessage="No colleges found"
        columns={[
          {
            key: "name",
            label: "College",
            render: (c) => <span className="font-semibold text-slate-900">{c.college_name}</span>,
          },
          {
            key: "university",
            label: "University",
            render: (c) => c.college_university_id?.university_name || "—",
          },
          {
            key: "email",
            label: "Email",
            render: (c) => c.college_email,
          },
          {
            key: "degrees_count",
            label: "Degrees",
            render: (c) => (
              <span className="font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {c.degreeCount ?? 0}
              </span>
            ),
          },
          {
            key: "tpos_count",
            label: "TPOs",
            render: (c) => (
              <span className="font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {c.tpoCount ?? 0}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (c) => (
              <span className={statusBadge(c.college_verified)}>
                {getStatusText(c.college_verified)}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "w-36",
            render: (c) => (
              <div className="flex gap-1">
                {getStatusText(c.college_verified) !== "Approved" && (
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

export default ManageCollege;
