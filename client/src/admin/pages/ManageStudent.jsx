import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiTrash2, FiUsers } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";
import DataTable from "../../common/components/DataTable";
import IconButton from "../../common/components/IconButton";

const HEADER_BY_ROLE = {
  Admin: { title: "Students", subtitle: "Browse and manage student profiles across all colleges." },
  College: { title: "College Students", subtitle: "Registered candidates and placement profiles at your college." },
  University: { title: "University Students", subtitle: "Students across your affiliated college network." },
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

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        icon={FiUsers}
        title={header.title}
        subtitle={header.subtitle}
        badge={`${students.length} total`}
        action={
          role === "Admin" ? (
            <Link
              to="/sign-up-student"
              state={{ fromAdmin: true }}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md inline-flex items-center gap-2 text-sm"
            >
              Add Student
            </Link>
          ) : null
        }
      />
      <DataTable
        data={students}
        searchKeys={["student_name", "student_email", "college_id.college_name", "branch_id.branch_name"]}
        searchPlaceholder="Search students…"
        emptyMessage="No students found"
        columns={[
          {
            key: "name",
            label: "Name",
            render: (s) => <span className="font-semibold text-slate-900">{s.student_name}</span>,
          },
          { key: "email", label: "Email", render: (s) => s.student_email },
          {
            key: "college",
            label: "College",
            render: (s) => s.college_id?.college_name || "—",
          },
          {
            key: "branch",
            label: "Branch",
            render: (s) => s.branch_id?.branch_name || "—",
          },
          {
            key: "actions",
            label: "Actions",
            className: "w-24",
            render: (s) => (
              <IconButton variant="danger" title="Delete" onClick={() => handleDelete(s._id)}>
                <FiTrash2 className="w-4 h-4" />
              </IconButton>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ManageStudent;
