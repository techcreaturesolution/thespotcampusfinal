import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FiFileText,
  FiUpload,
  FiDownload,
  FiEye,
  FiRefreshCw,
  FiArchive,
  FiTrash2,
  FiSearch,
  FiAlertCircle,
  FiLink,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "./Loading";
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_STATUS_OPTIONS,
  DOCUMENT_VISIBILITY_OPTIONS,
  validateDocumentFileSelection,
  formatFileSize,
} from "../../utils/documentsValidation";

const ResumeDocumentsSection = ({
  studentId = null,
  role = "Student",
  canEdit = true,
  defaultType = "",
  compact = false,
}) => {
  const isSelfMode = !studentId && role === "Student";
  const baseEndpoint = isSelfMode ? "/documents/me" : `/documents/student/${studentId}`;

  const [documents, setDocuments] = useState([]);
  const [quota, setQuota] = useState(null);
  const [resumeVersions, setResumeVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [typeFilter, setTypeFilter] = useState(defaultType);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Upload state
  const [docType, setDocType] = useState(defaultType || "RESUME");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("Private");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("document_type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const qs = params.toString() ? `?${params.toString()}` : "";

      const [docRes, verRes] = await Promise.all([
        customFetch.get(`${baseEndpoint}${qs}`),
        isSelfMode ? customFetch.get("/resume-versions/me").catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
      ]);
      setDocuments(docRes.data?.documents || []);
      setQuota(docRes.data?.quota || null);
      setResumeVersions(verRes.data?.resume_versions || []);
    } catch (error) {
      setErrorMsg(error?.response?.data?.msg || "Failed to load uploaded documents");
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, typeFilter, statusFilter, searchTerm, isSelfMode]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      setFileError("");
      return;
    }
    const err = validateDocumentFileSelection(file, docType);
    if (err) {
      setFileError(err);
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    setFileError("");
    setSelectedFile(file);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const err = validateDocumentFileSelection(selectedFile, docType);
    if (err) {
      setFileError(err);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("document", selectedFile);
      fd.append("document_type", docType);
      fd.append("visibility", visibility);
      if (title.trim()) fd.append("title", title.trim());

      await customFetch.post(baseEndpoint, fd);
      toast.success("Document uploaded securely");
      setSelectedFile(null);
      setTitle("");
      await loadDocuments();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceFile = async (doc, e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const err = validateDocumentFileSelection(file, doc.document_type);
    if (err) {
      toast.error(err);
      e.target.value = "";
      return;
    }
    try {
      const fd = new FormData();
      fd.append("document", file);
      fd.append("document_type", doc.document_type);
      await customFetch.put(`${baseEndpoint}/${doc.id}/replace`, fd);
      toast.success("Document replaced (new version saved)");
      await loadDocuments();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to replace document");
    } finally {
      e.target.value = "";
    }
  };

  const handleDownload = async (doc, inline = false) => {
    try {
      const res = await customFetch.get(
        `${baseEndpoint}/${doc.id}/download${inline ? "?inline=true" : ""}`,
        { responseType: "blob" },
      );
      const blob = new Blob([res.data], { type: doc.mime_type || "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      if (inline) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.original_filename || "document";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 45000);
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Unable to access document");
    }
  };

  const handleToggleArchive = async (doc) => {
    const nextStatus = doc.status === "Archived" ? "Available" : "Archived";
    try {
      await customFetch.patch(`${baseEndpoint}/${doc.id}`, { status: nextStatus });
      toast.success(`Document ${nextStatus === "Archived" ? "archived" : "restored"}`);
      await loadDocuments();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update document status");
    }
  };

  const handleDelete = async (docId) => {
    try {
      await customFetch.delete(`${baseEndpoint}/${docId}`);
      toast.success("Document deleted");
      setConfirmDeleteId(null);
      await loadDocuments();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to delete document");
    }
  };

  const handleAssociateResumeVersion = async (docId, resumeVersionId) => {
    try {
      await customFetch.post(`${baseEndpoint}/${docId}/associate-resume`, {
        resume_version_id: resumeVersionId || null,
      });
      toast.success(
        resumeVersionId
          ? "Linked uploaded resume to resume version"
          : "Unlinked from resume versions",
      );
      await loadDocuments();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update resume association");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FiFileText className="text-[#3730a3]" />
            Uploaded Resume Files &amp; Documents
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#3730a3]">
              {documents.length}
            </span>
          </h3>
          {!compact && (
            <p className="text-xs text-slate-500 mt-0.5">
              Private authenticated storage with content-signature validation, replacement versioning, and S1-08 association.
            </p>
          )}
        </div>
        {quota && (
          <div className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
            Quota: {quota.document_count}/{quota.max_documents} files •{" "}
            {formatFileSize(quota.storage_used_bytes)} /{" "}
            {formatFileSize(quota.max_total_storage_bytes)}
          </div>
        )}
      </div>

      {/* Secure Upload Form */}
      {canEdit && (
        <form
          onSubmit={handleUpload}
          className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value);
                  setSelectedFile(null);
                  setFileError("");
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
              >
                {DOCUMENT_TYPE_OPTIONS.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Backend Engineer Resume (PDF)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
              >
                {DOCUMENT_VISIBILITY_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#3730a3] cursor-pointer text-xs font-semibold text-slate-600">
              <FiUpload className="w-4 h-4 text-[#3730a3]" />
              <span className="truncate">
                {selectedFile
                  ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                  : docType === "RESUME"
                    ? "Choose Resume (PDF, DOC, DOCX — max 10 MB)"
                    : "Choose File (PDF, DOC, DOCX, JPG, PNG — max 10 MB)"}
              </span>
              <input
                type="file"
                accept={
                  docType === "RESUME"
                    ? ".pdf,.doc,.docx"
                    : ".pdf,.doc,.docx,.jpg,.jpeg,.png"
                }
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-5 py-2.5 rounded-xl bg-[#3730a3] hover:bg-[#2d268c] text-white text-xs font-extrabold disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
          {fileError && <p className="text-xs text-red-600 font-semibold">{fileError}</p>}
        </form>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative">
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search filename or title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
        >
          <option value="">All Document Types</option>
          {DOCUMENT_TYPE_OPTIONS.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
        >
          <option value="">All Statuses</option>
          {DOCUMENT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loading />
        </div>
      ) : errorMsg ? (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-semibold">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </span>
          <button
            type="button"
            onClick={loadDocuments}
            className="px-3 py-1 rounded-lg bg-white border border-red-200 font-bold"
          >
            Retry
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
          <p className="text-sm font-bold text-slate-800">No uploaded documents found</p>
          <p className="text-xs text-slate-500 mt-1">
            Upload your existing resume PDF/DOCX or profile certificates securely above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const linkedVersion = resumeVersions.find(
              (v) => String(v.uploaded_document_id) === String(doc.id),
            );
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900 truncate">
                        {doc.title}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#3730a3]">
                        {doc.document_type}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        v{doc.version}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doc.status === "Archived"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {doc.status}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {doc.visibility}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {doc.original_filename} • {formatFileSize(doc.file_size)} • SHA-256:{" "}
                      {String(doc.checksum || "").slice(0, 12)}…
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {doc.preview_supported && (
                      <button
                        type="button"
                        onClick={() => handleDownload(doc, true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] text-xs font-bold"
                      >
                        <FiEye className="w-3.5 h-3.5" /> View
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownload(doc, false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      <FiDownload className="w-3.5 h-3.5" /> Download
                    </button>
                    {canEdit && (
                      <>
                        <label
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          title="Replace file"
                        >
                          <FiRefreshCw className="w-4 h-4" />
                          <input
                            type="file"
                            accept={
                              doc.document_type === "RESUME"
                                ? ".pdf,.doc,.docx"
                                : ".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            }
                            onChange={(e) => handleReplaceFile(doc, e)}
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(doc)}
                          title={doc.status === "Archived" ? "Restore" : "Archive"}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                          <FiArchive className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(doc.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* S1-08 Resume Version Link */}
                {isSelfMode &&
                  canEdit &&
                  doc.document_type === "RESUME" &&
                  resumeVersions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                      <FiLink className="w-3.5 h-3.5 text-[#3730a3]" />
                      <span className="font-bold text-slate-600">
                        Link to Resume Version (S1-08):
                      </span>
                      <select
                        value={linkedVersion?.id || ""}
                        onChange={(e) =>
                          handleAssociateResumeVersion(doc.id, e.target.value)
                        }
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <option value="">Not linked</option>
                        {resumeVersions.map((rv) => (
                          <option key={rv.id} value={rv.id}>
                            {rv.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                {confirmDeleteId === doc.id && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-red-800">
                      Delete &ldquo;{doc.original_filename}&rdquo;?
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResumeDocumentsSection;
