import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiTrash2, FiUser } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import IconButton from "../../common/components/IconButton";

const ManageTpo = () => {
  const [tpos, setTpos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await customFetch.get("/tpo");
      setTpos(data.tpos || []);
    } catch {
      setTpos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this TPO?")) return;
    try {
      await customFetch.delete(`/tpo/${id}`);
      toast.success("TPO deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiUser}
        title="Training & Placement Officers"
        subtitle="Manage TPO accounts assigned to colleges."
        badge={`${tpos.length} total`}
      />
      <DataTable
        data={tpos}
        searchKeys={["tpo_name", "tpo_email", "tpo_college_id.college_name", "tpo_college_id.college_university_id.university_name", "tpo_degree_id.degree_name"]}
        searchPlaceholder="Search TPOs…"
        emptyMessage="No TPOs found"
        columns={[
          {
            key: "name",
            label: "Name",
            render: (t) => <span className="font-semibold text-slate-900">{t.tpo_name}</span>,
          },
          { key: "email", label: "Email", render: (t) => t.tpo_email },
          {
            key: "degree",
            label: "Degree",
            render: (t) => t.tpo_degree_id?.degree_name || "—",
          },
          {
            key: "college",
            label: "College",
            render: (t) => t.tpo_college_id?.college_name || "—",
          },
          {
            key: "university",
            label: "University",
            render: (t) => t.tpo_college_id?.college_university_id?.university_name || "—",
          },

          {
            key: "actions",
            label: "Actions",
            className: "w-24",
            render: (t) => (
              <IconButton variant="danger" title="Delete" onClick={() => handleDelete(t._id)}>
                <FiTrash2 className="w-4 h-4" />
              </IconButton>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ManageTpo;
