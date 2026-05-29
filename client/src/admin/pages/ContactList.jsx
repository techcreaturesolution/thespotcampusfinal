import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiTrash2 } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchData = async () => { try { const { data } = await customFetch.get("/contact"); setContacts(data.contacts || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);
  const handleDelete = async (id) => { try { await customFetch.delete(`/contact/${id}`); toast.success("Deleted"); fetchData(); } catch { toast.error("Failed"); } };
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contact Inquiries</h1>
      <div className="space-y-3">
        {contacts.map((c) => (
          <div key={c._id} className="card">
            <div className="flex justify-between">
              <div><p className="font-medium">{c.name}</p><p className="text-sm text-gray-500">{c.email} | {c.contact}</p><p className="text-sm text-gray-700 mt-1">{c.subject}</p><p className="text-sm text-gray-600 mt-1">{c.message}</p></div>
              <button onClick={() => handleDelete(c._id)} className="p-2 text-red-600 hover:bg-red-50 rounded self-start"><FiTrash2 /></button>
            </div>
          </div>
        ))}
        {contacts.length === 0 && <div className="text-center py-10 text-gray-400"><p>No contacts</p></div>}
      </div>
    </div>
  );
};

export default ContactList;
