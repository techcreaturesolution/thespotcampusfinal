import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FiAward,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiArrowUp,
  FiArrowDown,
  FiX,
  FiSearch,
  FiAlertCircle,
  FiFileText,
  FiUpload,
  FiArchive,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "./Loading";
import {
  CERTIFICATION_CATEGORIES,
  CERTIFICATION_STATUS_OPTIONS,
  CERTIFICATION_VISIBILITY_OPTIONS,
  isSafeHttpsCredentialUrl,
  validateCertificationForm,
  validateCertificateFileSelection,
} from "../../utils/certificationsValidation";

const INITIAL_FORM = {
  title: "",
  issuing_organization: "",
  category: "Technical",
  credential_id: "",
  credential_url: "",
  issue_date: "",
  expiry_date: "",
  does_not_expire: false,
  description: "",
  visibility: "Public",
  status: "Active",
};

const toDateInput = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const CertificationsSection = ({
  studentId = null,
  role = "Student",
  canEdit = true,
  onUpdated = null,
  compact = false,
}) => {
  const isSelfMode = !studentId && role === "Student";
  const baseEndpoint = isSelfMode
    ? "/certifications/me"
    : `/certifications/student/${studentId}`;

  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal form state
  const [showForm, setShowForm] = useState(false);
  const [editingCertId, setEditingCertId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingAttachment, setExistingAttachment] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadCertifications = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const { data } = await customFetch.get(`${baseEndpoint}${queryStr}`);
      setCertifications(data.certifications || []);
    } catch (error) {
      setErrorMsg(error?.response?.data?.msg || "Failed to load certifications");
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, statusFilter, categoryFilter, searchTerm]);

  useEffect(() => {
    loadCertifications();
  }, [loadCertifications]);

  useEffect(() => {
    if (!showForm) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowForm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showForm]);

  const openAddModal = () => {
    setEditingCertId(null);
    setFormData(INITIAL_FORM);
    setSelectedFile(null);
    setExistingAttachment(null);
    setFormErrors({});
    setShowForm(true);
  };

  const openEditModal = (cert) => {
    setEditingCertId(cert.id);
    setFormData({
      title: cert.title || "",
      issuing_organization: cert.issuing_organization || "",
      category: cert.category || "Technical",
      credential_id: cert.credential_id || "",
      credential_url: cert.credential_url || "",
      issue_date: toDateInput(cert.issue_date),
      expiry_date: cert.does_not_expire ? "" : toDateInput(cert.expiry_date),
      does_not_expire: Boolean(cert.does_not_expire),
      description: cert.description || "",
      visibility: cert.visibility || "Public",
      status: cert.status || "Active",
    });
    setSelectedFile(null);
    setExistingAttachment(cert.attachment || null);
    setFormErrors({});
    setShowForm(true);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "does_not_expire" && value) {
        next.expiry_date = "";
      }
      return next;
    });
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const err = validateCertificateFileSelection(file);
    if (err) {
      setFormErrors((prev) => ({ ...prev, file: err }));
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    setFormErrors((prev) => ({ ...prev, file: "" }));
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateCertificationForm(formData);
    if (selectedFile) {
      const fileErr = validateCertificateFileSelection(selectedFile);
      if (fileErr) errs.file = fileErr;
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      toast.error("Please fix the highlighted certification fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        issuing_organization: formData.issuing_organization.trim(),
        category: formData.category,
        credential_id: formData.credential_id.trim(),
        credential_url: formData.credential_url.trim(),
        issue_date: formData.issue_date,
        expiry_date: formData.does_not_expire ? null : formData.expiry_date || null,
        does_not_expire: Boolean(formData.does_not_expire),
        description: formData.description.trim(),
        visibility: formData.visibility,
        status: formData.status,
      };

      let savedId = editingCertId;
      if (editingCertId) {
        const { data } = await customFetch.patch(`${baseEndpoint}/${editingCertId}`, payload);
        savedId = data?.certification?.id || editingCertId;
      } else {
        const { data } = await customFetch.post(baseEndpoint, payload);
        savedId = data?.certification?.id;
      }

      if (selectedFile && savedId) {
        const fd = new FormData();
        fd.append("certificate", selectedFile);
        await customFetch.post(`${baseEndpoint}/${savedId}/certificate`, fd);
      }

      toast.success(editingCertId ? "Certification updated" : "Certification added");
      setShowForm(false);
      await loadCertifications();
      if (onUpdated) onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to save certification");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (certId) => {
    try {
      await customFetch.delete(`${baseEndpoint}/${certId}`);
      toast.success("Certification deleted");
      setConfirmDeleteId(null);
      await loadCertifications();
      if (onUpdated) onUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to delete certification");
    }
  };

  const handleToggleArchive = async (cert) => {
    const nextStatus = cert.status === "Archived" ? "Active" : "Archived";
    try {
      await customFetch.patch(`${baseEndpoint}/${cert.id}`, { status: nextStatus });
      toast.success(`Certification ${nextStatus === "Archived" ? "archived" : "restored"}`);
      await loadCertifications();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to update certification status");
    }
  };

  const handleRemoveAttachment = async (certId) => {
    try {
      await customFetch.delete(`${baseEndpoint}/${certId}/certificate`);
      toast.success("Certificate document removed");
      setExistingAttachment(null);
      await loadCertifications();
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to remove document");
    }
  };

  const handleViewAttachment = async (cert) => {
    try {
      const response = await customFetch.get(`${baseEndpoint}/${cert.id}/certificate`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: cert.attachment?.mime_type || "application/pdf",
      });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Unable to open certificate file");
    }
  };

  const handleMove = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= certifications.length) return;
    const reordered = [...certifications];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setCertifications(reordered);

    try {
      const orders = reordered.map((c, idx) => ({
        certification_id: c.id,
        display_order: idx,
      }));
      await customFetch.patch(`${baseEndpoint}/reorder`, { orders });
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Failed to save certification order");
      loadCertifications();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FiAward className="text-[#3730a3]" />
            Certifications &amp; Credentials
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#3730a3]">
              {certifications.length}
            </span>
          </h3>
          {!compact && (
            <p className="text-xs text-slate-500 mt-0.5">
              Verified-format professional &amp; technical credentials with expiry tracking and proof attachments.
            </p>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#3730a3] hover:bg-[#2d268c] text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Add Certification
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative">
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search title, issuer, credential ID..."
            aria-label="Search certifications"
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#3730a3]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#3730a3]"
        >
          <option value="">All Categories</option>
          {CERTIFICATION_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#3730a3]"
        >
          <option value="">All Statuses</option>
          {CERTIFICATION_STATUS_OPTIONS.map((s) => (
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
            onClick={loadCertifications}
            className="px-3 py-1 rounded-lg bg-white border border-red-200 font-bold hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : certifications.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-[#3730a3] flex items-center justify-center mb-3">
            <FiAward className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No certifications added yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Add industry certifications, cloud badges, or course credentials with issue dates and verification links.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {certifications.map((cert, index) => (
            <div
              key={cert.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-indigo-200 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">{cert.title}</h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#3730a3]">
                      {cert.category}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        cert.status === "Archived"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : cert.is_expired
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {cert.status === "Archived"
                        ? "Archived"
                        : cert.is_expired
                          ? "Expired"
                          : cert.does_not_expire
                            ? "No Expiry"
                            : "Active"}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {cert.visibility}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700">
                    Issued by {cert.issuing_organization}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                    <span>Issued: {toDateInput(cert.issue_date)}</span>
                    <span>
                      {cert.does_not_expire
                        ? "Does not expire"
                        : cert.expiry_date
                          ? `Expires: ${toDateInput(cert.expiry_date)}`
                          : "No expiry set"}
                    </span>
                    {cert.credential_id && <span>Credential ID: {cert.credential_id}</span>}
                  </div>

                  {cert.description && (
                    <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                      {cert.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {isSafeHttpsCredentialUrl(cert.credential_url) && (
                      <a
                        href={cert.credential_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] text-xs font-bold transition-colors"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" />
                        Verify / View Credential
                      </a>
                    )}
                    {cert.has_attachment && (
                      <button
                        type="button"
                        onClick={() => handleViewAttachment(cert)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <FiFileText className="w-3.5 h-3.5" />
                        {cert.attachment?.original_name || "Certificate Document"}
                      </button>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0}
                      title="Move up"
                      aria-label="Move certification up"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <FiArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === certifications.length - 1}
                      title="Move down"
                      aria-label="Move certification down"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <FiArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(cert)}
                      title={cert.status === "Archived" ? "Restore" : "Archive"}
                      aria-label="Toggle archive"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      <FiArchive className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(cert)}
                      title="Edit"
                      aria-label="Edit certification"
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(cert.id)}
                      title="Delete"
                      aria-label="Delete certification"
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {confirmDeleteId === cert.id && (
                <div className="mt-3 pt-3 border-t border-red-100 flex flex-wrap items-center justify-between gap-2 bg-red-50/70 p-2.5 rounded-xl">
                  <span className="text-xs font-bold text-red-800">
                    Delete &ldquo;{cert.title}&rdquo;? This cannot be undone.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cert.id)}
                      className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={editingCertId ? "Edit Certification" : "Add Certification"}
        >
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingCertId ? "Edit Certification" : "Add Certification"}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close modal"
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="cert-title" className="block text-xs font-bold text-slate-700 mb-1">
                    Certification Title *
                  </label>
                  <input
                    id="cert-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder="e.g., AWS Certified Solutions Architect"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#3730a3]"
                  />
                  {formErrors.title && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cert-issuer" className="block text-xs font-bold text-slate-700 mb-1">
                    Issuing Organization *
                  </label>
                  <input
                    id="cert-issuer"
                    type="text"
                    value={formData.issuing_organization}
                    onChange={(e) => handleFieldChange("issuing_organization", e.target.value)}
                    placeholder="e.g., Amazon Web Services"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#3730a3]"
                  />
                  {formErrors.issuing_organization && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {formErrors.issuing_organization}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="cert-category" className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    id="cert-category"
                    value={formData.category}
                    onChange={(e) => handleFieldChange("category", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-[#3730a3]"
                  >
                    {CERTIFICATION_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cert-cred-id" className="block text-xs font-bold text-slate-700 mb-1">
                    Credential ID
                  </label>
                  <input
                    id="cert-cred-id"
                    type="text"
                    value={formData.credential_id}
                    onChange={(e) => handleFieldChange("credential_id", e.target.value)}
                    placeholder="e.g., AWS-ASA-12345"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#3730a3]"
                  />
                  {formErrors.credential_id && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.credential_id}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cert-cred-url" className="block text-xs font-bold text-slate-700 mb-1">
                    Credential URL (HTTPS)
                  </label>
                  <input
                    id="cert-cred-url"
                    type="url"
                    value={formData.credential_url}
                    onChange={(e) => handleFieldChange("credential_url", e.target.value)}
                    placeholder="https://www.credly.com/badges/..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#3730a3]"
                  />
                  {formErrors.credential_url && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.credential_url}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cert-issue-date" className="block text-xs font-bold text-slate-700 mb-1">
                    Issue Date *
                  </label>
                  <input
                    id="cert-issue-date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => handleFieldChange("issue_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#3730a3]"
                  />
                  {formErrors.issue_date && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.issue_date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cert-expiry-date" className="block text-xs font-bold text-slate-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    id="cert-expiry-date"
                    type="date"
                    disabled={formData.does_not_expire}
                    value={formData.does_not_expire ? "" : formData.expiry_date}
                    onChange={(e) => handleFieldChange("expiry_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-[#3730a3]"
                  />
                  {formErrors.expiry_date && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.expiry_date}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.does_not_expire}
                      onChange={(e) => handleFieldChange("does_not_expire", e.target.checked)}
                      className="rounded border-slate-300 text-[#3730a3]"
                    />
                    This credential does not expire
                  </label>
                </div>

                <div>
                  <label htmlFor="cert-visibility" className="block text-xs font-bold text-slate-700 mb-1">
                    Visibility
                  </label>
                  <select
                    id="cert-visibility"
                    value={formData.visibility}
                    onChange={(e) => handleFieldChange("visibility", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-[#3730a3]"
                  >
                    {CERTIFICATION_VISIBILITY_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cert-status" className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    id="cert-status"
                    value={formData.status}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-[#3730a3]"
                  >
                    {CERTIFICATION_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="cert-desc" className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    id="cert-desc"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    placeholder="Key topics covered, score, or honors..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#3730a3]"
                  />
                  {formErrors.description && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                  <label htmlFor="cert-file" className="block text-xs font-bold text-slate-700 mb-1">
                    Certificate Attachment (Optional — PDF, JPG, PNG, max 5 MB)
                  </label>
                  {existingAttachment && !selectedFile && (
                    <div className="mb-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="truncate font-semibold text-slate-700">
                        Current: {existingAttachment.original_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(editingCertId)}
                        className="text-red-600 font-bold hover:underline shrink-0"
                      >
                        Remove File
                      </button>
                    </div>
                  )}
                  <label
                    htmlFor="cert-file"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#3730a3] cursor-pointer text-xs font-semibold text-slate-600"
                  >
                    <FiUpload className="w-4 h-4 text-[#3730a3]" />
                    <span>{selectedFile ? selectedFile.name : "Choose PDF or Image file"}</span>
                  </label>
                  <input
                    id="cert-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  {formErrors.file && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.file}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#3730a3] hover:bg-[#2d268c] text-white text-xs font-extrabold disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingCertId ? "Update Certification" : "Save Certification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationsSection;
