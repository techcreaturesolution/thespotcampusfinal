import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FiCpu, FiFileText, FiSettings, FiCheckCircle } from "react-icons/fi";
import customFetch from "../utils/customFetch";

const CreateExamFromJD = () => {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    noOfQuestion: 20,
    timeLimit: 60,
    hard: 30,
    medium: 40,
    easy: 30,
    proctoring: {
      enabled: true,
      tabLockEnabled: true,
      cameraEnabled: true,
      cameraIntervalSeconds: 30,
      maxViolations: 5,
      autoSubmitOnMaxViolations: true,
      fullScreenRequired: true,
      copyPasteDisabled: true,
      rightClickDisabled: true,
      screenshotBlocked: true,
    },
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await customFetch.get(`/jobs/${jobId}`);
        setJob(data.job);
        setFormData((prev) => ({
          ...prev,
          title: `Assessment for ${data.job.job_title}`,
        }));
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load job details");
        navigate("/dashboard/manage-job");
      }
    };
    fetchJob();
  }, [jobId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalDifficulty = formData.hard + formData.medium + formData.easy;
    if (totalDifficulty !== 100) {
      toast.error("Difficulty percentages must sum to 100");
      return;
    }

    setGenerating(true);
    try {
      await customFetch.post("/exam/from-jd", {
        job_id: jobId,
        ...formData,
      });
      toast.success("Exam generated from Job Description successfully!");
      navigate("/dashboard/manage-job");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to generate exam");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FiCpu className="w-7 h-7 text-primary-600" />
          Generate Exam from Job Description
        </h1>
        <p className="text-gray-500 mt-1">
          AI will analyze the JD and create relevant assessment questions
        </p>
      </div>

      {/* Job Details Preview */}
      {job && (
        <div className="card mb-6 border-l-4 border-l-primary-500">
          <div className="flex items-start gap-3">
            <FiFileText className="w-5 h-5 text-primary-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">{job.job_title}</h3>
              <p className="text-sm text-gray-500">{job.job_position} | {job.job_type} | {job.job_work_mode}</p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Skills:</strong> {job.job_skills}
              </p>
              {job.job_desc && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                  <strong>Description:</strong> {job.job_desc}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exam Settings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Title
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                className="input-field"
                value={formData.noOfQuestion}
                onChange={(e) => setFormData({ ...formData, noOfQuestion: Number(e.target.value) })}
                min="5"
                max="100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                className="input-field"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
                min="5"
                required
              />
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Difficulty Distribution (must total 100%)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Easy (%)</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.easy}
                  onChange={(e) => setFormData({ ...formData, easy: Number(e.target.value) })}
                  min="0"
                  max="100"
                />
                <div className="h-1.5 bg-green-200 rounded-full mt-1">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${formData.easy}%` }} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Medium (%)</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.medium}
                  onChange={(e) => setFormData({ ...formData, medium: Number(e.target.value) })}
                  min="0"
                  max="100"
                />
                <div className="h-1.5 bg-amber-200 rounded-full mt-1">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${formData.medium}%` }} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hard (%)</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.hard}
                  onChange={(e) => setFormData({ ...formData, hard: Number(e.target.value) })}
                  min="0"
                  max="100"
                />
                <div className="h-1.5 bg-red-200 rounded-full mt-1">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${formData.hard}%` }} />
                </div>
              </div>
            </div>
            <p className={`text-xs mt-2 ${formData.hard + formData.medium + formData.easy === 100 ? "text-green-600" : "text-red-600"}`}>
              Total: {formData.hard + formData.medium + formData.easy}%
              {formData.hard + formData.medium + formData.easy !== 100 && " (must be 100%)"}
            </p>
          </div>
        </div>

        {/* Proctoring Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiSettings className="w-5 h-5" /> Proctoring Settings
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: "tabLockEnabled", label: "Tab Lock", desc: "Detect and record tab switches" },
              { key: "cameraEnabled", label: "Camera Monitoring", desc: "Periodic camera captures" },
              { key: "fullScreenRequired", label: "Full Screen Required", desc: "Force full-screen mode" },
              { key: "copyPasteDisabled", label: "Disable Copy/Paste", desc: "Block copy, paste, and select" },
              { key: "rightClickDisabled", label: "Disable Right Click", desc: "Block context menu" },
              { key: "screenshotBlocked", label: "Block Screenshots", desc: "Prevent PrintScreen" },
              { key: "autoSubmitOnMaxViolations", label: "Auto Submit", desc: "Auto-submit on max violations" },
            ].map((setting) => (
              <label
                key={setting.key}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{setting.label}</p>
                  <p className="text-xs text-gray-500">{setting.desc}</p>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded"
                  checked={formData.proctoring[setting.key]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      proctoring: { ...formData.proctoring, [setting.key]: e.target.checked },
                    })
                  }
                />
              </label>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Camera Interval (seconds)
              </label>
              <input
                type="number"
                className="input-field"
                value={formData.proctoring.cameraIntervalSeconds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    proctoring: { ...formData.proctoring, cameraIntervalSeconds: Number(e.target.value) },
                  })
                }
                min="10"
                max="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Violations before Auto-Submit
              </label>
              <input
                type="number"
                className="input-field"
                value={formData.proctoring.maxViolations}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    proctoring: { ...formData.proctoring, maxViolations: Number(e.target.value) },
                  })
                }
                min="1"
                max="20"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/dashboard/manage-job")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={generating}
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Generating with AI...
              </>
            ) : (
              <>
                <FiCpu className="w-4 h-4" /> Generate Exam from JD
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExamFromJD;
