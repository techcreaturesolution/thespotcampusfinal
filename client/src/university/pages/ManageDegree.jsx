import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiBookOpen, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import IconButton from "../../common/components/IconButton";
import AddDegreeModal from "../components/AddDegreeModal";

const ManageDegree = () => {
  const { user } = useOutletContext();
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchDegrees = async () => {
    try {
      const { data } = await customFetch.get("/degree");
      setDegrees(data.degrees || []);
    } catch (error) {
      toast.error("Failed to load degrees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDegrees();
  }, []);

  const handleSubmit = async (degreeData) => {
    try {
      const payload = {
        ...degreeData,
      };
      await customFetch.post("/degree", payload);
      toast.success("Degree added successfully!");
      resetForm();
      fetchDegrees();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to add degree");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this degree?")) return;
    try {
      await customFetch.delete(`/degree/${id}`);
      toast.success("Degree deleted successfully");
      fetchDegrees();
    } catch (error) {
      toast.error("Failed to delete degree");
    }
  };

  const resetForm = () => {
    setShowForm(false);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiBookOpen}
        title="Manage Degrees"
        subtitle="Manage the academic degrees offered by your college."
        badge={`${degrees.length} degrees`}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <FiPlus /> Add Degree
          </button>
        }
      />

      <DataTable
        data={degrees}
        searchKeys={["degree_name", "degree_code"]}
        searchPlaceholder="Search degrees…"
        emptyMessage="No degrees added yet. Add a new academic degree to get started."
        columns={[
          {
            key: "code",
            label: "Degree Code",
            render: (d) => (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
                {d.degree_code}
              </span>
            ),
          },
          {
            key: "name",
            label: "Degree Name",
            render: (d) => (
              <span className="font-semibold text-slate-900">
                {d.degree_name}
              </span>
            ),
          },
          {
            key: "semesters",
            label: "Semesters",
            render: (d) => d.degree_sem || "—",
          },
          {
            key: "actions",
            label: "Actions",
            className: "w-24",
            render: (d) => (
              <IconButton
                variant="danger"
                title="Delete"
                onClick={() => handleDelete(d._id)}
              >
                <FiTrash2 className="w-4 h-4" />
              </IconButton>
            ),
          },
        ]}
      />

      <AddDegreeModal
        isOpen={showForm}
        onClose={resetForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ManageDegree;
