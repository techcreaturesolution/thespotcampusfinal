import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const TEST_TYPES = ["company", "subject", "mixed"];

const CreateMockTestModal = ({ isOpen, onClose, mockTest, subjects = [], onSubmit }) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    title: "",
    description: "",
    test_type: "subject",
    company_name: "",
    subject_id: "",
    total_questions: 20,
    duration_minutes: 30,
    negative_marking: false,
    negative_mark_value: 0.25,
    marks_per_question: 1,
    passing_percentage: 40,
    randomize_questions: true,
    difficulty: "mixed",
  });

  useEffect(() => {
    if (mockTest) {
      setForm({
        title: mockTest.title || "",
        description: mockTest.description || "",
        test_type: mockTest.test_type || "subject",
        company_name: mockTest.company_name || "",
        subject_id: mockTest.subject_id?._id || mockTest.subject_id || "",
        total_questions: mockTest.total_questions ?? 20,
        duration_minutes: mockTest.duration_minutes ?? 30,
        negative_marking: mockTest.negative_marking ?? false,
        negative_mark_value: mockTest.negative_mark_value ?? 0.25,
        marks_per_question: mockTest.marks_per_question ?? 1,
        passing_percentage: mockTest.passing_percentage ?? 40,
        randomize_questions: mockTest.randomize_questions ?? true,
        difficulty: mockTest.difficulty || "mixed",
      });
    } else {
      setForm({
        title: "",
        description: "",
        test_type: "subject",
        company_name: "",
        subject_id: "",
        total_questions: 20,
        duration_minutes: 30,
        negative_marking: false,
        negative_mark_value: 0.25,
        marks_per_question: 1,
        passing_percentage: 40,
        randomize_questions: true,
        difficulty: "mixed",
      });
    }
  }, [mockTest]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, subject_id: form.subject_id || undefined };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-100 animate-scale-in text-left">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo_TSC.png" alt="The Spot Campus" className="h-7 object-contain" />
            <span className="text-slate-300">|</span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {mockTest ? "Edit Mock Test" : "Create Mock Test"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-55 hover:text-slate-700 text-slate-400 transition-all duration-200">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Test Title
              </label>
              <input
                type="text"
                placeholder="e.g. TCS NQT Aptitude Test"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Test Type
              </label>
              <select
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200 bg-white"
                value={form.test_type}
                onChange={(e) => setForm({ ...form, test_type: e.target.value })}
                required
              >
                {TEST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)} Mock
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              placeholder="Provide test instructions or description..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              rows="2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {form.test_type === "company" && (
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Google, TCS, Infosys"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                required
              />
            </div>
          )}

          {form.test_type === "subject" && (
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Select Subject
              </label>
              <select
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200 bg-white"
                value={form.subject_id}
                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Total Questions
              </label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.total_questions}
                onChange={(e) => setForm({ ...form, total_questions: Number(e.target.value) || 0 })}
                min="1"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Duration (min)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) || 0 })}
                min="1"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Marks/Question
              </label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.marks_per_question}
                onChange={(e) => setForm({ ...form, marks_per_question: Number(e.target.value) || 1 })}
                min="1"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Pass %
              </label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.passing_percentage}
                onChange={(e) => setForm({ ...form, passing_percentage: Number(e.target.value) || 0 })}
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="negative_marking"
                checked={form.negative_marking}
                onChange={(e) => setForm({ ...form, negative_marking: e.target.checked })}
                className="rounded border-slate-350 text-indigo-650 focus:ring-indigo-500 w-4 h-4"
              />
              <label htmlFor="negative_marking" className="text-xs text-slate-600 font-extrabold uppercase select-none cursor-pointer">
                Negative Marking
              </label>
            </div>

            {form.negative_marking && (
              <div className="flex items-center gap-2 animate-scale-in">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase">Value:</label>
                <input
                  type="number"
                  step="0.01"
                  className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] text-xs font-extrabold text-slate-850 w-24"
                  value={form.negative_mark_value}
                  onChange={(e) => setForm({ ...form, negative_mark_value: Number(e.target.value) || 0 })}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="randomize_questions"
                checked={form.randomize_questions}
                onChange={(e) => setForm({ ...form, randomize_questions: e.target.checked })}
                className="rounded border-slate-350 text-indigo-650 focus:ring-indigo-500 w-4 h-4"
              />
              <label htmlFor="randomize_questions" className="text-xs text-slate-600 font-extrabold uppercase select-none cursor-pointer">
                Randomize
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase">Difficulty:</label>
              <select
                className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] bg-white text-xs font-extrabold text-slate-850"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-55 text-slate-700 font-extrabold py-2.5 px-5 rounded-xl border border-slate-200 transition-all duration-200 text-[10px] uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md hover:opacity-95 text-[10px] uppercase tracking-wider"
            >
              {mockTest ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMockTestModal;
