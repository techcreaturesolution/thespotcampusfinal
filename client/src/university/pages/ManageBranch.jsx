import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiCpu, FiBookOpen } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";

const ManageBranch = () => {
  const { user } = useOutletContext();
  const [branches, setBranches] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      <PageHeader
        icon={FiCpu}
        title="Manage Branches"
        subtitle="Manage academic branches and specializations offered under each degree plan."
        badge={`${branches.length} branches`}
      />

      {degrees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
          <FiBookOpen className="w-12 h-12 text-[#3730a3]/20 mb-3" />
          <h3 className="font-extrabold text-slate-755 text-base">Setup Prerequisite Required</h3>
          <p className="text-xs text-slate-455 mt-1 max-w-sm mx-auto leading-relaxed mb-5">
            You must configure at least one academic Degree program before specializations/branches can be registered in the system.
          </p>
          <Link
            to="/dashboard/university/manage-degree"
            className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-md shadow-indigo-500/10 flex items-center gap-1.5"
          >
            Go to Degrees Catalogue
          </Link>
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
          <FiCpu className="w-12 h-12 text-[#3730a3]/20 mb-3 animate-pulse" />
          <h3 className="font-extrabold text-slate-750 text-base">No branches configured</h3>
          <p className="text-xs text-slate-455 mt-1 max-w-xs mx-auto leading-relaxed">
            Create specialization branches (e.g. Computer Science, Mechanical Eng.) linked to parent degree programs.
          </p>
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
          ]}
        />
      )}
    </div>
  );
};

export default ManageBranch;
