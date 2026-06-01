import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiBookOpen, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import IconButton from "../../common/components/IconButton";

const ManageDegree = () => {
  const { user } = useOutletContext();
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    degree_name: "",
    degree_code: "",
    degree_sem: "6",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        degree_name: form.degree_name,
        degree_code: form.degree_code,
        degree_sem: Number(form.degree_sem),
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
    setForm({
      degree_name: "",
      degree_code: "",
      degree_sem: "6",
    });
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

      {/* Add Degree Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Degree
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bachelor of Computer Applications"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm"
                  value={form.degree_name}
                  onChange={(e) =>
                    setForm({ ...form, degree_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. BCA"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm"
                  value={form.degree_code}
                  onChange={(e) =>
                    setForm({ ...form, degree_code: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Semesters
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm"
                  value={form.degree_sem}
                  onChange={(e) =>
                    setForm({ ...form, degree_sem: e.target.value })
                  }
                  required
                  min="1"
                  max="12"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition shadow-sm"
                >
                  Add Degree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDegree;
