import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiCpu, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import IconButton from "../../common/components/IconButton";

const ManageBranch = () => {
  const { user } = useOutletContext();
  const [branches, setBranches] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    degree_id: "",
    branch_name: "",
    branch_code: "",
  });

  const fetchData = async () => {
    try {
      const degreeRes = await customFetch.get("/degree");
      setDegrees(degreeRes.data.degrees || []);

      const branchRes = await customFetch.get("/branch");
      setBranches(branchRes.data.branches || []);
    } catch (error) {
      toast.error("Failed to load academic data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        degree_id: form.degree_id,
        branch_name: form.branch_name,
        branch_code: form.branch_code,
      };
      await customFetch.post("/branch", payload);
      toast.success("Branch added successfully!");
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to add branch");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    try {
      await customFetch.delete(`/branch/${id}`);
      toast.success("Branch deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete branch");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setForm({
      degree_id: "",
      branch_name: "",
      branch_code: "",
    });
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiCpu}
        title="Manage Branches"
        subtitle="Manage the academic branches and specializations offered under each degree."
        badge={`${branches.length} branches`}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            disabled={degrees.length === 0}
            title={
              degrees.length === 0 ? "Add a degree first to add branches" : ""
            }
          >
            <FiPlus /> Add Branch
          </button>
        }
      />

      <DataTable
        data={branches}
        searchKeys={["branch_name", "branch_code", "degree_id.degree_name"]}
        searchPlaceholder="Search branches…"
        emptyMessage={
          degrees.length === 0
            ? "You must add at least one Degree in the 'Degrees' tab before adding branches."
            : "No branches added yet. Add a new specialization branch to get started."
        }
        columns={[
          {
            key: "code",
            label: "Branch Code",
            render: (b) => (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                {b.branch_code}
              </span>
            ),
          },
          {
            key: "name",
            label: "Branch Name",
            render: (b) => (
              <span className="font-semibold text-slate-900">
                {b.branch_name}
              </span>
            ),
          },
          {
            key: "degree",
            label: "Parent Degree",
            render: (b) => b.degree_id?.degree_name || "—",
          },
          {
            key: "actions",
            label: "Actions",
            className: "w-24",
            render: (b) => (
              <IconButton
                variant="danger"
                title="Delete"
                onClick={() => handleDelete(b._id)}
              >
                <FiTrash2 className="w-4 h-4" />
              </IconButton>
            ),
          },
        ]}
      />

      {/* Add Branch Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Branch
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
                  Select Parent Degree
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm bg-white"
                  value={form.degree_id}
                  onChange={(e) =>
                    setForm({ ...form, degree_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select Degree</option>
                  {degrees.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.degree_name} ({d.degree_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch / Specialization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science and Engineering"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm"
                  value={form.branch_name}
                  onChange={(e) =>
                    setForm({ ...form, branch_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CSE"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm"
                  value={form.branch_code}
                  onChange={(e) =>
                    setForm({ ...form, branch_code: e.target.value })
                  }
                  required
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
                  Add Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBranch;
