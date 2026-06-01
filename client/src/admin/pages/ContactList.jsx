import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiTrash2, FiMessageSquare, FiMail, FiPhone, FiSearch } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import IconButton from "../../common/components/IconButton";

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchData = async () => {
    try {
      const { data } = await customFetch.get("/contact");
      setContacts(data.contacts || []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this inquiry?")) return;
    try {
      await customFetch.delete(`/contact/${id}`);
      toast.success("Inquiry removed");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = contacts.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [c.name, c.email, c.subject, c.message].some((v) =>
      String(v ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiMessageSquare}
        title="Contact Inquiries"
        subtitle="Messages submitted from the public contact form."
        badge={`${contacts.length} total`}
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search inquiries…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((c) => (
          <article
            key={c._id}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-primary-200 transition-colors"
          >
            <div className="flex justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-sm font-medium text-primary-600">{c.subject}</span>
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <FiMail className="w-3.5 h-3.5" /> {c.email}
                  </span>
                  {c.contact && (
                    <span className="inline-flex items-center gap-1.5">
                      <FiPhone className="w-3.5 h-3.5" /> {c.contact}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
                  {c.message}
                </p>
              </div>
              <IconButton variant="danger" title="Delete" onClick={() => handleDelete(c._id)}>
                <FiTrash2 className="w-4 h-4" />
              </IconButton>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-500 text-sm">
            <FiMessageSquare className="w-10 h-10 text-gray-300" />
            <p>{contacts.length === 0 ? "No contact inquiries yet" : "No matches for your search"}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;
