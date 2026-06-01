import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiCpu, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import IconButton from "../../common/components/IconButton";
import AddBranchModal from "../components/AddBranchModal";

const ManageBranch = () => {
  const { user } = useOutletContext();
  const [branches, setBranches] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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

  const handleSubmit = async (branchData) => {
    try {
      const payload = {
        ...branchData,
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

      <AddBranchModal
        isOpen={showForm}
        onClose={resetForm}
        degrees={degrees}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ManageBranch;
