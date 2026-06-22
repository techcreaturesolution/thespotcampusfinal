import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const CreateQuestionModal = ({ isOpen, onClose, question, subjects = [], onSubmit }) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    subject_id: "",
    question_text: "",
    options: [
      { text: "", is_correct: true },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
    correct_option_index: 0,
    explanation: "",
    difficulty: "medium",
    company_name: "",
    year: "",
    is_previous_year: false,
    tags: "",
  });

  useEffect(() => {
    if (question) {
      setForm({
        subject_id: question.subject_id?._id || question.subject_id || "",
        question_text: question.question_text || "",
        options: question.options && question.options.length > 0
          ? question.options.map(opt => ({ ...opt }))
          : [
            { text: "", is_correct: true },
            { text: "", is_correct: false },
            { text: "", is_correct: false },
            { text: "", is_correct: false },
          ],
        correct_option_index: question.correct_option_index ?? 0,
        explanation: question.explanation || "",
        difficulty: question.difficulty || "medium",
        company_name: question.company_name || "",
        year: question.year || "",
        is_previous_year: question.is_previous_year || false,
        tags: Array.isArray(question.tags) ? question.tags.join(", ") : question.tags || "",
      });
    } else {
      setForm({
        subject_id: "",
        question_text: "",
        options: [
          { text: "", is_correct: true },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
        correct_option_index: 0,
        explanation: "",
        difficulty: "medium",
        company_name: "",
        year: "",
        is_previous_year: false,
        tags: "",
      });
    }
  }, [question]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const processedOptions = form.options.map((opt, i) => ({
      ...opt,
      is_correct: i === form.correct_option_index,
    }));
    const payload = {
      ...form,
      options: processedOptions,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      year: form.year ? Number(form.year) : null,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-100 animate-scale-in text-left">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo_TSC.webp" alt="The Spot Campus" className="h-7 object-contain" />
            <span className="text-slate-300">|</span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {question ? "Edit Question" : "Add Question"}
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
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Difficulty
              </label>
              <select
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200 bg-white"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Question Text
            </label>
            <textarea
              placeholder="Type the question details here..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              rows="3"
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Options (Select the correct option)
            </label>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct-option"
                  checked={form.correct_option_index === i}
                  onChange={() => setForm({ ...form, correct_option_index: i })}
                  className="w-4 h-4 text-indigo-650 focus:ring-indigo-500 border-slate-300"
                />
                <input
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  value={opt.text}
                  onChange={(e) => {
                    const opts = [...form.options];
                    opts[i] = { ...opts[i], text: e.target.value };
                    setForm({ ...form, options: opts });
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Explanation (Optional)
            </label>
            <textarea
              placeholder="Explain why the selected option is correct..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              rows="2"
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Company Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Google"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Year (Optional)
              </label>
              <input
                type="number"
                placeholder="e.g. 2024"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_previous_year"
                checked={form.is_previous_year}
                onChange={(e) => setForm({ ...form, is_previous_year: e.target.checked })}
                className="rounded border-slate-350 text-indigo-650 focus:ring-indigo-500 w-4 h-4"
              />
              <label htmlFor="is_previous_year" className="text-xs text-slate-650 font-extrabold uppercase select-none cursor-pointer">
                Previous Year
              </label>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Tags (Comma separated, optional)
            </label>
            <input
              type="text"
              placeholder="e.g. array, loops, sorting"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition duration-200"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
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
              {question ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestionModal;
