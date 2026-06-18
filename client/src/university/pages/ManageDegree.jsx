import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiBookOpen, FiClock, FiCpu } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";

const ManageDegree = () => {
  const { user } = useOutletContext();
  const [degrees, setDegrees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [degreeRes, branchRes] = await Promise.all([
        customFetch.get("/degree"),
        customFetch.get("/branch"),
      ]);
      setDegrees(degreeRes.data.degrees || []);
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
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3 space-y-6">
      <PageHeader
        icon={FiBookOpen}
        title="Degrees & Branches"
        subtitle="View the academic degrees and specialization branches offered under your university affiliation."
        badge={`${degrees.length} Degrees • ${branches.length} Branches`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Degrees Column */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <FiBookOpen className="text-[#3730a3] w-4.5 h-4.5" /> Degrees Offered
          </h2>
          {degrees.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm font-semibold">No degrees added yet.</p>
            </div>
          ) : (
            <DataTable
              data={degrees}
              searchKeys={["degree_name", "degree_code"]}
              searchPlaceholder="Search degrees..."
              emptyMessage="No degrees match your search query"
              columns={[
                {
                  key: "code",
                  label: "Code",
                  render: (d) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-[#3730a3] border border-indigo-150">
                      {d.degree_code}
                    </span>
                  ),
                },
                {
                  key: "name",
                  label: "Degree Name",
                  render: (d) => (
                    <span className="font-extrabold text-slate-800 text-xs">
                      {d.degree_name}
                    </span>
                  ),
                },
                {
                  key: "semesters",
                  label: "Duration",
                  render: (d) => (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[11px] font-bold">
                      <FiClock className="w-3 h-3 text-slate-400" />
                      {d.degree_sem || 6} Sems
                    </span>
                  ),
                },
              ]}
            />
          )}
        </div>

        {/* Branches Column */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <FiCpu className="text-emerald-500 w-4.5 h-4.5" /> Specialization Branches
          </h2>
          {branches.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm font-semibold">No branches configured.</p>
            </div>
          ) : (
            <DataTable
              data={branches}
              searchKeys={["branch_name", "branch_code", "degree_id.degree_name"]}
              searchPlaceholder="Search branches..."
              emptyMessage="No branches match your search criteria"
              columns={[
                {
                  key: "code",
                  label: "Code",
                  render: (b) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-[#3730a3] border border-indigo-150">
                      {b.branch_code}
                    </span>
                  ),
                },
                {
                  key: "name",
                  label: "Branch / Specialization",
                  render: (b) => (
                    <span className="font-extrabold text-slate-800 text-xs">
                      {b.branch_name}
                    </span>
                  ),
                },
                {
                  key: "degree",
                  label: "Parent Degree",
                  render: (b) => (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-150">
                      {b.degree_id?.degree_code || "—"}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageDegree;
