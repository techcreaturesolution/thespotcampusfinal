import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiBook, FiChevronRight, FiTarget } from "react-icons/fi";
import customFetch from "../../../utils/customFetch";
import Loading from "../../../common/components/Loading";
import PageHeader from "../../../common/components/PageHeader";

const SubjectPractice = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try { const { data } = await customFetch.get("/preparation/subjects/active"); setSubjects(data.subjects); }
      catch { toast.error("Failed to load subjects"); }
      finally { setLoading(false); }
    };
    fetchSubjects();
  }, []);

  const handleSubjectClick = async (subject) => {
    setSelectedSubject(subject);
    try {
      const { data } = await customFetch.get(`/preparation/topics/subject/${subject._id}`);
      setTopics(data.topics);
    } catch { toast.error("Failed to load topics"); }
  };

  const handleTopicClick = (topic) => {
    navigate(`/dashboard/student/preparation/practice/${topic._id}`, { state: { topic, subject: selectedSubject } });
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Subject Wise Practice" subtitle="Focused preparation by subject and topic" />

      {!selectedSubject ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => (
            <div key={s._id} onClick={() => handleSubjectClick(s)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <FiBook className="text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{s.name}</h4>
                    <p className="text-xs text-gray-500">{s.topic_count || 0} topics &middot; {s.question_count || 0} questions</p>
                  </div>
                </div>
                <FiChevronRight className="text-gray-400" />
              </div>
              <div className="mt-3">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs capitalize">{s.category}</span>
              </div>
            </div>
          ))}
          {subjects.length === 0 && <p className="text-center text-gray-500 py-8 col-span-3">No subjects available yet</p>}
        </div>
      ) : (
        <div>
          <button onClick={() => { setSelectedSubject(null); setTopics([]); }}
            className="flex items-center gap-1 text-sm text-indigo-600 mb-4 hover:underline">
            &larr; Back to Subjects
          </button>
          <div className="bg-indigo-50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <FiBook className="text-indigo-600 text-xl" />
            <div>
              <h3 className="font-bold text-gray-800">{selectedSubject.name}</h3>
              <p className="text-xs text-gray-500">{selectedSubject.description}</p>
            </div>
          </div>
          <div className="space-y-3">
            {topics.map(t => (
              <div key={t._id} onClick={() => handleTopicClick(t)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiTarget className="text-purple-600" />
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.question_count || t.total_questions || 0} questions</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">Practice</button>
              </div>
            ))}
            {topics.length === 0 && <p className="text-center text-gray-500 py-8">No topics available for this subject</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPractice;
