import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiBook, FiChevronRight, FiCheckCircle } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const SubjectPractice = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await customFetch.get("/preparation/subjects/active");
        setSubjects(data.subjects);
      } catch {
        toast.error("Failed to load subjects");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleSubjectClick = (subject) => {
    navigate(`/dashboard/student/preparation/practice/${subject._id}`, { state: { subject } });
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        title="Subject Wise Practice"
        subtitle="Focused preparation with detailed question lists grouped by subjects"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((s) => (
          <div
            key={s._id}
            onClick={() => handleSubjectClick(s)}
            className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-650 group-hover:scale-105 transition-transform">
                    <FiBook className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-indigo-650 transition-colors">
                      {s.name}
                    </h4>
                    <p className="text-xs text-slate-450 mt-0.5">
                      {s.question_count || 0} questions
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <FiChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Tag Badge Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-3">
              <span className="px-2.5 py-0.5 bg-[#2563eb]/5 text-[#2563eb] border border-[#2563eb]/10 rounded-full text-[9px] font-black uppercase tracking-wider capitalize">
                {s.category}
              </span>
              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                <FiCheckCircle className="w-3.5 h-3.5" /> Start Practice
              </span>
            </div>
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium">No subjects are currently active for practice.</p>
        </div>
      )}
    </div>
  );
};

export default SubjectPractice;

