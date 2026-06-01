import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiUser, FiShield, FiAlertTriangle, FiClock } from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const ExamResult = () => {
  const { id } = useParams();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await customFetch.get(`/paper/${id}`);
        setPapers(data.papers || []);
      } catch {
        setPapers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Exam Results</h1>
      <div className="space-y-4">
        {papers.map((paper) => (
          <div key={paper._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{paper.student_id?.student_name || "Student"}</p>
                  <p className="text-sm text-gray-500">{paper.student_id?.student_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{paper.score}</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${(paper.proctoring?.trustScore || 100) >= 70 ? "text-green-600" : "text-red-600"}`}>
                    {paper.proctoring?.trustScore || 100}%
                  </p>
                  <p className="text-xs text-gray-500">Trust</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-600">{paper.proctoring?.totalViolations || 0}</p>
                  <p className="text-xs text-gray-500">Violations</p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    paper.status === "submitted"
                      ? "bg-emerald-100 text-emerald-800"
                      : paper.status === "auto_submitted"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {paper.status}
                </span>
              </div>
            </div>
          </div>
        ))}
        {papers.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>No submissions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResult;
