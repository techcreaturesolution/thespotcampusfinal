import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FiCpu, FiFileText, FiSettings, FiX } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";

const CreateExamFromJDModal = ({ isOpen, onClose, jobId, onSuccess }) => {
  if (!isOpen) return null;

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
    if (!jobId) return;
    const fetchJob = async () => {
      try {
        setLoading(true);
        const { data } = await customFetch.get(`/jobs/${jobId}`);
        setJob(data.job);
        setFormData((prev) => ({
          ...prev,
          title: `Assessment for ${data.job.job_title}`,
        }));
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load job details");
        onClose();
      }
    };
    fetchJob();
  }, [jobId]);

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
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to generate exam");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-[#3730a3] rounded-xl shrink-0">
              <FiCpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Generate Exam from Job Description</h3>
              <p className="text-xxs font-semibold text-slate-400 mt-0.5">AI will analyze the JD and create relevant assessment questions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-50">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-12">
              <Loading />
            </div>
          ) : (
            <form id="from-jd-exam-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Job Info Preview */}
              {job && (
                <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-4 text-xs font-semibold">
                  <div className="flex items-start gap-2.5">
                    <FiFileText className="w-4 h-4 text-[#3730a3] mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-slate-850">{job.job_title}</h4>
                      <p className="text-slate-500 mt-0.5">{job.job_position} &bull; {job.job_type} &bull; {job.job_work_mode}</p>
                      <p className="text-slate-500 mt-2 font-bold"><strong>Required Skills:</strong> <span className="text-[#3730a3] font-extrabold">{job.job_skills}</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Exam Config */}
              <div className="bg-[#f8f9ff]/60 rounded-2xl border border-indigo-100/50 p-5 space-y-4">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Exam Settings</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Exam Title</label>
                    <input type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Number of Questions</label>
                    <input type="number" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={formData.noOfQuestion} onChange={(e) => setFormData({ ...formData, noOfQuestion: Number(e.target.value) })} min="5" max="100" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Time Limit (minutes)</label>
                    <input type="number" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={formData.timeLimit} onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })} min="5" required />
                  </div>
                </div>

                {/* Difficulty */}
                <div className="pt-2">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Difficulty Distribution (must total 100%)</label>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Easy (%)</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={formData.easy} onChange={(e) => setFormData({ ...formData, easy: Number(e.target.value) })} min="0" max="100" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Medium (%)</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={formData.medium} onChange={(e) => setFormData({ ...formData, medium: Number(e.target.value) })} min="0" max="100" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Hard (%)</label>
                      <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={formData.hard} onChange={(e) => setFormData({ ...formData, hard: Number(e.target.value) })} min="0" max="100" />
                    </div>
                  </div>
                  <p className={`text-xs mt-2.5 font-bold ${formData.hard + formData.medium + formData.easy === 100 ? "text-emerald-600" : "text-rose-600"}`}>
                    Total: {formData.hard + formData.medium + formData.easy}% {formData.hard + formData.medium + formData.easy !== 100 && "(must be 100%)"}
                  </p>
                </div>
              </div>

              {/* Proctoring Settings */}
              <div className="bg-[#f8f9ff]/60 rounded-2xl border border-indigo-100/50 p-5 space-y-4">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><FiSettings className="text-[#3730a3]" /> Proctoring Settings</h4>
                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  {[
                    { key: "tabLockEnabled", label: "Tab Lock", desc: "Detect and record tab switches" },
                    { key: "cameraEnabled", label: "Camera Monitoring", desc: "Periodic camera captures" },
                    { key: "fullScreenRequired", label: "Full Screen Required", desc: "Force full-screen mode" },
                    { key: "copyPasteDisabled", label: "Disable Copy/Paste", desc: "Block copy, paste, and select" },
                    { key: "rightClickDisabled", label: "Disable Right Click", desc: "Block context menu" },
                    { key: "screenshotBlocked", label: "Block Screenshots", desc: "Prevent PrintScreen" },
                    { key: "autoSubmitOnMaxViolations", label: "Auto Submit", desc: "Auto-submit on max violations" },
                  ].map((setting) => (
                    <label key={setting.key} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50/50 hover:border-slate-350 transition-all duration-150">
                      <div>
                        <p className="font-extrabold text-slate-800">{setting.label}</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{setting.desc}</p>
                      </div>
                      <input type="checkbox" className="w-4 h-4 text-[#3730a3] border-slate-300 rounded focus:ring-[#3730a3] cursor-pointer" checked={formData.proctoring[setting.key]} onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, [setting.key]: e.target.checked } })} />
                    </label>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Camera Interval (seconds)</label>
                    <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={formData.proctoring.cameraIntervalSeconds} onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, cameraIntervalSeconds: Number(e.target.value) } })} min="10" max="120" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Max Violations before Auto-Submit</label>
                    <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#3730a3]/50 focus:border-[#3730a3] outline-none" value={formData.proctoring.maxViolations} onChange={(e) => setFormData({ ...formData, proctoring: { ...formData.proctoring, maxViolations: Number(e.target.value) } })} min="1" max="20" />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-end gap-3 flex-shrink-0">
          <button type="button" className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-5 rounded-xl border border-slate-200 text-sm transition" onClick={onClose} disabled={generating}>
            Cancel
          </button>
          <button type="submit" form="from-jd-exam-form" className="vibrant-btn text-white font-bold py-2.5 px-5 rounded-xl transition shadow-md flex items-center gap-1.5 text-sm" disabled={generating || loading}>
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

      </div>
    </div>
  );
};

export default CreateExamFromJDModal;
