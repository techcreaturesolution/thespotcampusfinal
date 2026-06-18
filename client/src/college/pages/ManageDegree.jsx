import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiBookOpen, FiClock, FiEdit } from "react-icons/fi";
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
  const [editingDegree, setEditingDegree] = useState(null);

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
      if (editingDegree) {
        await customFetch.patch(`/degree/${editingDegree._id}`, payload);
        toast.success("Degree updated successfully!");
      } else {
        await customFetch.post("/degree", payload);
        toast.success("Degree added successfully!");
      }
      resetForm();
      fetchDegrees();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to save degree");
    }
  };

  const handleEdit = (degree) => {
    setEditingDegree(degree);
    setShowForm(true);
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
    setEditingDegree(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      <PageHeader
        icon={FiBookOpen}
        title="Manage Degrees"
        subtitle="Manage academic degrees and curriculum pathways offered by your college."
        badge={`${degrees.length} degrees`}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2.5 px-5 rounded-xl transition shadow-md shadow-indigo-500/10 flex items-center gap-2 text-xs"
          >
            <FiPlus className="w-4 h-4" /> Add Degree
          </button>
        }
      />

      {degrees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
          <FiBookOpen className="w-12 h-12 text-[#3730a3]/20 mb-3" />
          <h3 className="font-extrabold text-slate-755 text-base">No degrees configured yet</h3>
          <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto leading-relaxed">
            Configure the academic degree programs (e.g. B.Tech, MCA, BCA) offered by your college to map branches and placement student profiles.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 bg-white hover:bg-slate-50 text-[#3730a3] border border-slate-200 font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <FiPlus className="w-3.5 h-3.5" /> Set Up First Degree
          </button>
        </div>
      ) : (
        <DataTable
          data={degrees}
          searchKeys={["degree_name", "degree_code"]}
          searchPlaceholder="Search degrees by code or name..."
          emptyMessage="No degrees match your search query"
          columns={[
            {
              key: "code",
              label: "Degree Code",
              render: (d) => (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#3730a3] border border-indigo-150 shadow-inner">
                  {d.degree_code}
                </span>
              ),
            },
            {
              key: "name",
              label: "Degree Name",
              render: (d) => (
                <span className="font-extrabold text-slate-800">
                  {d.degree_name}
                </span>
              ),
            },
            {
              key: "semesters",
              label: "Duration",
              render: (d) => (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-650 border border-slate-200 rounded-lg text-xs font-bold">
                  <FiClock className="w-3.5 h-3.5 text-slate-400" />
                  {d.degree_sem || 6} Semesters
                </span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              className: "w-32 text-right",
              render: (d) => (
                <div className="flex items-center justify-end gap-1.5">
                  <IconButton
                    variant="neutral"
                    title="Edit Degree"
                    onClick={() => handleEdit(d)}
                  >
                    <FiEdit className="w-3.5 h-3.5 text-indigo-650" />
                  </IconButton>
                  <IconButton
                    variant="danger"
                    title="Delete Degree"
                    onClick={() => handleDelete(d._id)}
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
              ),
            },
          ]}
        />
      )}

      <AddDegreeModal
        isOpen={showForm}
        onClose={resetForm}
        degree={editingDegree}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ManageDegree;
