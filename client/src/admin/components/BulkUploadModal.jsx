import React, { useState } from "react";
import { FiX, FiUploadCloud, FiDownload, FiAlertCircle, FiCheckCircle, FiInfo } from "react-icons/fi";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import customFetch from "../../utils/customFetch";

const BulkUploadModal = ({ isOpen, onClose, subjects = [], onUploadSuccess }) => {
  if (!isOpen) return null;

  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFileType(droppedFile)) {
        setFile(droppedFile);
      } else {
        toast.error("Please upload only Excel (.xlsx, .xls) or CSV files");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile);
      } else {
        toast.error("Please upload only Excel (.xlsx, .xls) or CSV files");
      }
    }
  };

  const isValidFileType = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    return ["xlsx", "xls", "csv"].includes(ext);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "Question": "What is the output of print(2 * 3) in Python?",
        "Option A": "5",
        "Option B": "6",
        "Option C": "8",
        "Option D": "9",
        "Answer": "B",
        "Difficulty": "easy",
        "Explanation (Optional)": "In Python, * is the multiplication operator. 2 * 3 equals 6.",
        "Company Name (Optional)": "Google",
        "Year (Optional)": 2024,
        "Previous Year": "Yes",
        "Tags (Comma Separated, Optional)": "python, operators, basics",
        "Subject": "Python",
        "Category": "programming"
      },
      {
        "Question": "Which data structure operates on FIFO (First In First Out) principle?",
        "Option A": "Stack",
        "Option B": "Queue",
        "Option C": "Linked List",
        "Option D": "Binary Tree",
        "Answer": "B",
        "Difficulty": "medium",
        "Explanation (Optional)": "A Queue is a linear structure which follows FIFO order for operations.",
        "Company Name (Optional)": "Amazon",
        "Year (Optional)": 2023,
        "Previous Year": "No",
        "Tags (Comma Separated, Optional)": "data structures, queue, fifo",
        "Subject": "Data Structures",
        "Category": "technical"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

    // Auto-fit columns
    worksheet["!cols"] = [
      { wch: 45 }, // Question
      { wch: 15 }, // Option A
      { wch: 15 }, // Option B
      { wch: 15 }, // Option C
      { wch: 15 }, // Option D
      { wch: 10 }, // Answer (A/B/C/D)
      { wch: 12 }, // Difficulty
      { wch: 30 }, // Explanation
      { wch: 15 }, // Company Name
      { wch: 8 },  // Year
      { wch: 15 }, // Is Previous Year
      { wch: 20 }, // Tags
      { wch: 15 }, // Subject
      { wch: 15 }  // Category
    ];

    XLSX.writeFile(workbook, "tsc_preparation_questions_template.xlsx");
    toast.success("Template downloaded successfully");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (uploading) return;
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (selectedSubjectIds.length > 0) {
      formData.append("subject_ids", selectedSubjectIds.join(","));
    }

    setUploading(true);
    try {
      const { data } = await customFetch.post("/preparation/questions/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResults(data);
      toast.success(data.msg || "Questions imported successfully");
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Error importing questions");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setSelectedSubjectIds([]);
    setResults(null);
    onClose();
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
              Bulk Upload Questions
            </h3>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-slate-55 hover:text-slate-700 text-slate-400 transition-all duration-200">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {results ? (
          /* Results view */
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-3">
              <FiCheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
              <div>
                <h4 className="font-extrabold text-slate-850 text-base">Import Completed!</h4>
                <p className="text-xs text-slate-500 mt-1">Here is a summary of the import results:</p>
              </div>
              <div className="grid grid-cols-3 gap-6 w-full max-w-md pt-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Rows</span>
                  <span className="text-lg font-black text-slate-750">{results.total}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                  <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider block">Success</span>
                  <span className="text-lg font-black text-emerald-600">{results.uploaded}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                  <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">Skipped</span>
                  <span className="text-lg font-black text-rose-600">{results.skipped}</span>
                </div>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-rose-600">
                  <FiAlertCircle className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Skipped Rows Details ({results.errors.length})</span>
                </div>
                <div className="border border-rose-100 rounded-2xl overflow-hidden max-h-[250px] overflow-y-auto bg-rose-50/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-rose-50 border-b border-rose-100 text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Row Number</th>
                        <th className="px-4 py-2.5">Reason for Failure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100 text-rose-800">
                      {results.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-rose-50/50">
                          <td className="px-4 py-2.5 font-bold">Row {err.row}</td>
                          <td className="px-4 py-2.5 font-medium">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResults(null)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-extrabold py-2.5 px-5 rounded-xl border border-slate-200 transition-all duration-200 text-[10px] uppercase tracking-wider active:scale-95"
              >
                Upload Another File
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md hover:opacity-95 text-[10px] uppercase tracking-wider active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Input form view */
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Select Default Subjects
              </label>
              <div className="border border-slate-200 rounded-2xl p-4 max-h-[160px] overflow-y-auto bg-white space-y-2">
                {subjects.map((s) => {
                  const isChecked = selectedSubjectIds.includes(s._id);
                  return (
                    <label key={s._id} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedSubjectIds(prev =>
                            prev.includes(s._id) ? prev.filter(id => id !== s._id) : [...prev, s._id]
                          );
                        }}
                        className="rounded border-slate-300 text-[#3730a3] focus:ring-[#3730a3] w-4 h-4 cursor-pointer"
                      />
                      <span>
                        {s.name}{" "}
                        <span className="text-[9px] text-slate-450 uppercase font-black bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 ml-1">
                          {s.category}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 block">
                Note: If you select multiple subjects, questions without a subject column in the Excel file will be imported to all selected subjects. If a subject is specified in the Excel row, it takes precedence.
              </span>
            </div>

            {/* Drag & Drop File Upload */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Upload File (Excel or CSV)
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-250 ${
                  dragOver
                    ? "border-[#3730a3] bg-[#3730a3]/5"
                    : file
                    ? "border-emerald-400 bg-emerald-50/10"
                    : "border-slate-300 hover:border-[#3730a3] bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  type="file"
                  id="bulk-file-upload"
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {file ? (
                  <div className="flex flex-col items-center text-center space-y-2">
                    <FiCheckCircle className="w-10 h-10 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-850 truncate max-w-[300px]">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-450 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-extrabold uppercase tracking-wide underline mt-1"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-2">
                    <FiUploadCloud className="w-10 h-10 text-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-750">
                        Drag and drop your file here, or <span className="text-[#3730a3] underline">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-450 mt-0.5">
                        Supports .xlsx, .xls, and .csv
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instruction Alert */}
            <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex gap-3 text-left">
              <FiInfo className="w-5 h-5 text-[#3730a3] shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-black text-slate-850 uppercase tracking-wider">Excel Template Format</h5>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Make sure your file has the correct headers: <code className="bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold text-slate-800 text-[10px]">Question</code>, <code className="bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold text-slate-800 text-[10px]">Option A</code>, <code className="bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold text-slate-800 text-[10px]">Option B</code>, <code className="bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold text-slate-800 text-[10px]">Option C</code>, <code className="bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold text-slate-800 text-[10px]">Option D</code>, and <code className="bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold text-slate-800 text-[10px]">Answer</code>.
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Optional columns: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold">Difficulty</code> (easy, medium, hard), <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold">Explanation (Optional)</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold">Company Name (Optional)</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold">Year (Optional)</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold">Previous Year</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold">Tags (Comma Separated, Optional)</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold">Subject</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold">Category</code>.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={downloadTemplate}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2.5 px-4 rounded-xl transition duration-200 text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 border border-slate-200"
              >
                <FiDownload className="w-3.5 h-3.5" /> Download Template
              </button>

              <div className="flex w-full sm:w-auto gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 sm:flex-initial bg-white hover:bg-slate-55 text-slate-700 font-extrabold py-2.5 px-5 rounded-xl border border-slate-200 transition duration-200 text-[10px] uppercase tracking-wider active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="flex-1 sm:flex-initial vibrant-btn text-white font-extrabold py-2.5 px-5 rounded-xl transition duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-[10px] uppercase tracking-wider active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {uploading ? "Uploading..." : "Upload & Import"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BulkUploadModal;
