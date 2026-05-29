import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiTrash2, FiCheck, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const ManageCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await customFetch.get("/company");
      setCompanies(data.companys || []);
    } catch { setCompanies([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatus = async (id, status) => {
    try {
      await customFetch.patch(`/company/${id}/status/${status}`);
      toast.success("Status updated");
      fetchData();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this company?")) return;
    try {
      await customFetch.delete(`/company/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Companies</h1>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-600">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.company_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.company_email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.company_contact}</td>
                <td className="px-4 py-3">
                  <span className={c.company_verified === "Approved" ? "badge-success" : c.company_verified === "Rejected" ? "badge-danger" : "badge-warning"}>
                    {c.company_verified || "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleStatus(c._id, "Approved")} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><FiCheck /></button>
                    <button onClick={() => handleStatus(c._id, "Rejected")} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><FiX /></button>
                    <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageCompany;
