import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiTrash2 } from "react-icons/fi";
import customFetch from "../utils/customFetch";

const ManageUniversity = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchData = async () => { try { const { data } = await customFetch.get("/university"); setUniversities(data.universitys || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);
  const handleDelete = async (id) => { if (!window.confirm("Delete?")) return; try { await customFetch.delete(`/university/${id}`); toast.success("Deleted"); fetchData(); } catch { toast.error("Failed"); } };
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Universities</h1>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-50 text-left text-sm text-gray-600"><th className="px-4 py-3">University</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Actions</th></tr></thead>
      <tbody className="divide-y">{universities.map((u) => (<tr key={u._id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{u.university_name}</td><td className="px-4 py-3 text-sm text-gray-600">{u.university_email}</td><td className="px-4 py-3"><button onClick={() => handleDelete(u._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button></td></tr>))}</tbody></table>
      {universities.length === 0 && <div className="text-center py-10 text-gray-400"><p>No universities found</p></div>}</div>
    </div>
  );
};

export default ManageUniversity;
