import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiTrash2 } from "react-icons/fi";
import customFetch from "../utils/customFetch";

const ManageTpo = () => {
  const [tpos, setTpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchData = async () => { try { const { data } = await customFetch.get("/tpo"); setTpos(data.tpos || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);
  const handleDelete = async (id) => { if (!window.confirm("Delete?")) return; try { await customFetch.delete(`/tpo/${id}`); toast.success("Deleted"); fetchData(); } catch { toast.error("Failed"); } };
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage TPOs</h1>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-50 text-left text-sm text-gray-600"><th className="px-4 py-3">Name</th><th className="px-4 py-3">College</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Actions</th></tr></thead>
      <tbody className="divide-y">{tpos.map((t) => (<tr key={t._id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{t.tpo_name}</td><td className="px-4 py-3 text-sm text-gray-600">{t.tpo_college_id?.college_name || "-"}</td><td className="px-4 py-3 text-sm text-gray-600">{t.tpo_email}</td><td className="px-4 py-3"><button onClick={() => handleDelete(t._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button></td></tr>))}</tbody></table>
      {tpos.length === 0 && <div className="text-center py-10 text-gray-400"><p>No TPOs found</p></div>}</div>
    </div>
  );
};

export default ManageTpo;
