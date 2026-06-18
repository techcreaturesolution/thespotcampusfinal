import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FiTrash2, FiUsers, FiMail, FiUserCheck, FiUserX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import IconButton from "../../common/components/IconButton";

const HEADER_BY_ROLE = {
  Admin: { title: "Students", subtitle: "Browse and manage student profiles across all colleges." },
  College: { title: "College Students", subtitle: "Registered candidates and placement profiles at your college." },
  University: { title: "University Students", subtitle: "Students directory across your affiliated college network." },
  TPO: { title: "Placement Candidates", subtitle: "Coordinate and review student profiles for placement drives." },
};

const ManageStudent = () => {
  const { role } = useOutletContext() || {};
  const header = HEADER_BY_ROLE[role] || HEADER_BY_ROLE.Admin;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data } = await customFetch.get("/student");
      setStudents(data.students || []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await customFetch.delete(`/student/${id}`);
      toast.success("Student deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleVerify = async (id, currentStatus) => {
    try {
      await customFetch.patch(`/student/${id}/verify`, { isVerifiedByTPO: !currentStatus });
      toast.success(currentStatus ? "Student unverified" : "Student verified successfully!");
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update verification status");
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
        icon={FiUsers}
        title={header.title}
        subtitle={header.subtitle}
        badge={`${students.length} students`}
      />
      <DataTable
        data={students}
        searchKeys={["student_name", "student_email", "college_id.college_name", "branch_id.branch_name"]}
        searchPlaceholder="Search students by name, email, college or branch..."
        emptyMessage="No students found matching your criteria"
        columns={[
          {
            key: "name",
            label: "Student Info",
            render: (s) => (
              <div className="flex items-center gap-3 py-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-[11px] border bg-gradient-to-br shadow-inner ${getAvatarBg(s.student_name)}`}>
                  {getInitials(s.student_name)}
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 block leading-snug">{s.student_name}</span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1"><FiMail className="w-3 h-3 text-slate-350" /> {s.student_email}</span>
                </div>
              </div>
            ),
          },
          {
            key: "college",
            label: "Affiliated College",
            render: (s) => (
              <div className="flex flex-col text-xs font-semibold text-slate-505 max-w-[250px] truncate" title={s.college_id?.college_name}>
                <span className="font-bold text-slate-700 truncate">{s.college_id?.college_name || "—"}</span>
                {s.college_id?.college_code && (
                  <span className="text-[10px] text-slate-400 mt-0.5">Code: {s.college_id.college_code}</span>
                )}
              </div>
            ),
          },
          {
            key: "branch",
            label: "Academic Stream",
            render: (s) => (
              <div className="flex flex-col text-xs font-semibold text-slate-505">
                <span className="font-bold text-slate-700">{s.branch_id?.branch_name || "—"}</span>
                {s.degree_id?.degree_code && (
                  <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">{s.degree_id.degree_code} Specialization</span>
                )}
              </div>
            ),
          },
          {
            key: "isVerifiedByTPO",
            label: "Verification Status",
            render: (s) => (
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${
                  s.isVerifiedByTPO
                    ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                    : "bg-amber-50 text-amber-700 border-amber-150"
                }`}
              >
                {s.isVerifiedByTPO ? "Verified" : "Pending"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "w-28 text-right",
            render: (s) => (
              <div className="flex items-center justify-end gap-1.5">
                {role === "College" && (
                  <IconButton
                    variant={s.isVerifiedByTPO ? "neutral" : "success"}
                    title={s.isVerifiedByTPO ? "Unverify Student" : "Verify Student"}
                    onClick={() => handleToggleVerify(s._id, s.isVerifiedByTPO)}
                  >
                    {s.isVerifiedByTPO ? (
                      <FiUserX className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <FiUserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </IconButton>
                )}
                <IconButton variant="danger" title="Delete Student Record" onClick={() => handleDelete(s._id)}>
                  <FiTrash2 className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ManageStudent;
