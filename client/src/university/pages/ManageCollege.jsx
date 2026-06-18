import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiGrid, FiMail, FiPhone, FiGlobe, FiMapPin, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";

const ManageCollege = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await customFetch.get("/college/my-colleges");
      setColleges(data.colleges || []);
    } catch (error) {
      toast.error("Failed to load affiliated colleges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (verifiedStatus) => {
    switch (verifiedStatus) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
            <FiCheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wider">
            <FiXCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
            <FiClock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      <PageHeader
        icon={FiGrid}
        title="Affiliated Colleges"
        subtitle="Manage and view all registered colleges under your university affiliation."
        badge={`${colleges.length} colleges`}
      />

      <DataTable
        data={colleges}
        searchKeys={["college_name", "college_code", "college_email", "college_address"]}
        searchPlaceholder="Search colleges by name, code, email, or address..."
        emptyMessage="No affiliated colleges found matching your search."
        columns={[
          {
            key: "college_info",
            label: "College Details",
            render: (c) => (
              <div className="flex items-center gap-4 py-1.5">
                {c.college_logo ? (
                  <img
                    src={c.college_logo}
                    alt={c.college_name}
                    className="w-12 h-12 rounded-xl object-contain border border-slate-100 bg-slate-50 p-1 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-sm border bg-gradient-to-br from-indigo-50 to-indigo-100 text-[#3730a3] border-indigo-200/50 shadow-inner">
                    {c.college_name?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                )}
                <div className="space-y-0.5">
                  <span className="font-extrabold text-slate-800 block text-sm tracking-tight leading-snug">
                    {c.college_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/50 uppercase tracking-wide">
                      Code: {c.college_code || "N/A"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Registered: {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "contact_info",
            label: "Contact & Communications",
            render: (c) => (
              <div className="space-y-1 text-xs font-semibold text-slate-600 py-1">
                {c.college_email && (
                  <div className="flex items-center gap-1.5 hover:text-[#3730a3] transition-colors">
                    <FiMail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${c.college_email}`} className="hover:underline">
                      {c.college_email}
                    </a>
                  </div>
                )}
                {c.college_contact && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <FiPhone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.college_contact}</span>
                  </div>
                )}
                {c.college_website && (
                  <div className="flex items-center gap-1.5 text-[#2563eb] transition-colors">
                    <FiGlobe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a
                      href={c.college_website.startsWith("http") ? c.college_website : `https://${c.college_website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {c.college_website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "address",
            label: "Location",
            render: (c) => (
              <div className="flex items-start gap-1.5 text-xs text-slate-500 max-w-[280px] font-semibold leading-normal py-1">
                <FiMapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2" title={c.college_address}>
                  {c.college_address || "No address listed."}
                </span>
              </div>
            ),
          },
          {
            key: "status",
            label: "Verification Status",
            className: "w-40 text-center",
            render: (c) => (
              <div className="flex items-center justify-center py-1.5">
                {getStatusBadge(c.college_verified)}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ManageCollege;
