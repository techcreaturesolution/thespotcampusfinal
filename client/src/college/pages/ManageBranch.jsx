import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiCpu, FiBookOpen, FiEdit } from "react-icons/fi";
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
  const [editingBranch, setEditingBranch] = useState(null);

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
      if (editingBranch) {
        await customFetch.patch(`/branch/${editingBranch._id}`, payload);
        toast.success("Branch updated successfully!");
      } else {
        await customFetch.post("/branch", payload);
        toast.success("Branch added successfully!");
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to save branch");
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setShowForm(true);
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
    setEditingBranch(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      <PageHeader
        icon={FiCpu}
        title="Manage Branches"
        subtitle="Manage academic branches and specializations offered under each degree program at your college."
        badge={`${branches.length} branches`}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#3730a3] hover:bg-indigo-755 text-white font-bold py-2.5 px-5 rounded-xl transition shadow-md shadow-indigo-500/10 flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={degrees.length === 0}
            title={
              degrees.length === 0 ? "Add a degree first to add branches" : ""
            }
          >
            <FiPlus className="w-4 h-4" /> Add Branch
          </button>
        }
      />

      {degrees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
          <FiBookOpen className="w-12 h-12 text-[#3730a3]/20 mb-3" />
          <h3 className="font-extrabold text-slate-755 text-base">Setup Prerequisite Required</h3>
          <p className="text-xs text-slate-455 mt-1 max-w-sm mx-auto leading-relaxed mb-5">
            You must configure at least one academic Degree program before specializations/branches can be registered in your college system.
          </p>
          <Link
            to="/dashboard/college/manage-degree"
            className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-md shadow-indigo-500/10 flex items-center gap-1.5"
          >
            Go to Degrees Catalogue
          </Link>
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
          <FiCpu className="w-12 h-12 text-[#3730a3]/20 mb-3 animate-pulse" />
          <h3 className="font-extrabold text-slate-755 text-base">No branches configured</h3>
          <p className="text-xs text-slate-455 mt-1 max-w-xs mx-auto leading-relaxed">
            Create specialization branches (e.g. Computer Science, Mechanical Eng.) linked to parent degree programs.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 bg-white hover:bg-slate-50 text-[#3730a3] border border-slate-200 font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Specialization Branch
          </button>
        </div>
      ) : (
        <DataTable
          data={branches}
          searchKeys={["branch_name", "branch_code", "degree_id.degree_name"]}
          searchPlaceholder="Search branches by code, name, or parent degree..."
          emptyMessage="No branches match your search criteria"
          columns={[
            {
              key: "code",
              label: "Branch Code",
              render: (b) => (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#3730a3] border border-indigo-150 shadow-inner">
                  {b.branch_code}
                </span>
              ),
            },
            {
              key: "name",
              label: "Branch / Specialization",
              render: (b) => (
                <span className="font-extrabold text-slate-800">
                  {b.branch_name}
                </span>
              ),
            },
            {
              key: "degree",
              label: "Parent Degree program",
              render: (b) => (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-150">
                    {b.degree_id?.degree_code || "—"}
                  </span>
                  <span className="font-bold text-slate-550 text-xs truncate max-w-[200px]" title={b.degree_id?.degree_name}>
                    {b.degree_id?.degree_name || ""}
                  </span>
                </div>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              className: "w-32 text-right",
              render: (b) => (
                <div className="flex items-center justify-end gap-1.5">
                  <IconButton
                    variant="neutral"
                    title="Edit Specialization Branch"
                    onClick={() => handleEdit(b)}
                  >
                    <FiEdit className="w-3.5 h-3.5 text-indigo-650" />
                  </IconButton>
                  <IconButton
                    variant="danger"
                    title="Delete Specialization Branch"
                    onClick={() => handleDelete(b._id)}
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
              ),
            },
          ]}
        />
      )}

      <AddBranchModal
        isOpen={showForm}
        onClose={resetForm}
        degrees={degrees}
        branch={editingBranch}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ManageBranch;
