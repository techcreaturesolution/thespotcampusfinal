import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiTrash2, FiUser, FiPlus, FiMail, FiPhone, FiEdit } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import IconButton from "../../common/components/IconButton";
import AddTpoModal from "../components/AddTpoModal";

const ManageTpo = () => {
  const { user } = useOutletContext() || {};
  const [tpos, setTpos] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTpo, setEditingTpo] = useState(null);

  const fetchData = async () => {
    try {
      const { data } = await customFetch.get("/tpo");
      const allTpos = data.tpos || [];
      // Filter TPOs by currently logged-in college ID
      const myTpos = allTpos.filter(
        (t) =>
          t.tpo_college_id?._id === user?._id ||
          t.tpo_college_id === user?._id
      );
      setTpos(myTpos);
    } catch {
      setTpos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDegrees = async () => {
    try {
      if (!user?._id) return;
      const { data } = await customFetch.get(`/dropdown/degrees?college_id=${user._id}`);
      setDegrees(data.degrees || []);
    } catch (error) {
      console.error("Failed to load degrees", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDegrees();
  }, [user?._id]);

  const handleModalSubmit = async (form) => {
    try {
      if (editingTpo) {
        await customFetch.patch(`/tpo/${editingTpo._id}`, form);
        toast.success("TPO updated successfully");
      } else {
        await customFetch.post("/tpo", {
          ...form,
          tpo_college_id: user?._id,
        });
        toast.success("TPO registered successfully");
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.msg || `Failed to ${editingTpo ? "update" : "add"} TPO`);
    }
  };

  const handleEdit = (tpo) => {
    setEditingTpo(tpo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTpo(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this TPO?")) return;
    try {
      await customFetch.delete(`/tpo/${id}`);
      toast.success("TPO deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvatarBg = (name) => {
    const colors = [
      "from-indigo-50 to-indigo-100 text-[#3730a3] border-indigo-200/50",
      "from-blue-50 to-blue-100 text-blue-700 border-blue-200/50",
      "from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200/50",
      "from-purple-50 to-purple-100 text-purple-700 border-purple-200/50",
      "from-rose-50 to-rose-100 text-rose-700 border-rose-200/50",
      "from-amber-50 to-amber-100 text-amber-700 border-amber-200/50",
    ];
    if (!name) return colors[0];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 py-3">
      <PageHeader
        icon={FiUser}
        title="Placement Officers"
        subtitle="Manage TPO accounts authorized for your college placement coordination."
        badge={`${tpos.length} TPO(s)`}
        action={
          <button
            onClick={() => {
              setEditingTpo(null);
              setIsModalOpen(true);
            }}
            className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2.5 px-5 rounded-xl transition shadow-md shadow-indigo-500/10 flex items-center gap-2 text-xs"
          >
            <FiPlus className="w-4 h-4" /> Add TPO
          </button>
        }
      />

      <DataTable
        data={tpos}
        searchKeys={["tpo_name", "tpo_email", "tpo_contact"]}
        searchPlaceholder="Search placement officers by name or email..."
        emptyMessage="No placement officers registered. Click 'Add TPO' to assign placement coordinators."
        columns={[
          {
            key: "name",
            label: "Placement Officer",
            render: (t) => (
              <div className="flex items-center gap-3 py-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-[11px] border bg-gradient-to-br shadow-inner ${getAvatarBg(t.tpo_name)}`}>
                  {getInitials(t.tpo_name)}
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 block leading-snug">{t.tpo_name}</span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                    {t.tpo_degree_id ? `${t.tpo_degree_id.degree_code} TPO` : "Campus TPO (All)"}
                  </span>
                </div>
              </div>
            ),
          },
          {
            key: "email",
            label: "Email Address",
            render: (t) => (
              <a href={`mailto:${t.tpo_email}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-650 hover:text-[#3730a3] transition">
                <FiMail className="w-3.5 h-3.5 text-slate-400" />
                {t.tpo_email}
              </a>
            ),
          },
          {
            key: "degree",
            label: "Assigned Degree",
            render: (t) => (
              t.tpo_degree_id ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#3730a3] border border-indigo-150 shadow-inner">
                  {t.tpo_degree_id.degree_name} ({t.tpo_degree_id.degree_code})
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                  All Degrees
                </span>
              )
            ),
          },
          {
            key: "contact",
            label: "Contact No",
            render: (t) => (
              t.tpo_contact ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-650">
                  <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                  {t.tpo_contact}
                </span>
              ) : (
                <span className="text-slate-350 text-xs">—</span>
              )
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "w-32 text-right",
            render: (t) => (
              <div className="flex items-center justify-end gap-1.5">
                <IconButton
                  variant="neutral"
                  title="Edit TPO Account"
                  onClick={() => handleEdit(t)}
                >
                  <FiEdit className="w-3.5 h-3.5 text-indigo-650" />
                </IconButton>
                <IconButton
                  variant="danger"
                  title="Delete TPO Account"
                  onClick={() => handleDelete(t._id)}
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />

      <AddTpoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        degrees={degrees}
        tpo={editingTpo}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default ManageTpo;
