import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiTrash2, FiUser, FiPlus } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import IconButton from "../../common/components/IconButton";
import AddTpoModal from "../components/AddTpoModal";

const ManageTpo = () => {
  const { user } = useOutletContext() || {};
  const [tpos, setTpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await customFetch.get("/tpo");
      const allTpos = data.tpos || [];
      // Filter TPOs by currently logged-in college ID
      const myTpos = allTpos.filter(
        (t) =>
          t.tpo_college_id?._id === user?._id ||
          t.tpo_college_id === user?._id
      );
      setTpos(myTpos);
    } catch {
      setTpos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?._id]);

  const handleAddTpo = async (form) => {
    try {
      await customFetch.post("/tpo", {
        ...form,
        tpo_college_id: user?._id,
      });
      toast.success("TPO registered successfully");
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to add TPO");
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          icon={FiUser}
          title="Placement Officers"
          subtitle="Manage TPO accounts authorized for your college placement coordination."
          badge={`${tpos.length} TPO(s)`}
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition shadow-sm hover:shadow"
        >
          <FiPlus className="w-4 h-4" /> Add TPO
        </button>
      </div>

      <DataTable
        data={tpos}
        searchKeys={["tpo_name", "tpo_email", "tpo_contact"]}
        searchPlaceholder="Search placement officers…"
        emptyMessage="No placement officers registered. Click 'Add TPO' to assign one."
        columns={[
          {
            key: "name",
            label: "Name",
            render: (t) => (
              <span className="font-semibold text-slate-900">{t.tpo_name}</span>
            ),
          },
          { key: "email", label: "Email Address", render: (t) => t.tpo_email },
          { key: "contact", label: "Contact No", render: (t) => t.tpo_contact || "—" },
          {
            key: "actions",
            label: "Actions",
            className: "w-24",
            render: (t) => (
              <IconButton
                variant="danger"
                title="Delete TPO Account"
                onClick={() => handleDelete(t._id)}
              >
                <FiTrash2 className="w-4 h-4" />
              </IconButton>
            ),
          },
        ]}
      />

      <AddTpoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTpo}
      />
    </div>
  );
};

export default ManageTpo;
