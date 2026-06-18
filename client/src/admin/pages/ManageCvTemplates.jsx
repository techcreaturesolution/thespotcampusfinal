import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiTrash2, FiFileText, FiPlus, FiX, FiCheck, FiUploadCloud, FiLayers, FiEdit } from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import PageHeader from "../../common/components/PageHeader";

const ManageCvTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New template form fields
  const [name, setName] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewThumbnail, setPreviewThumbnail] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const handleEditClick = (template) => {
    setEditingId(template._id);
    setName(template.name);
    setPreviewThumbnail(template.thumbnail || null);
    setThumbnailFile(null);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setName("");
    setThumbnailFile(null);
    setPreviewThumbnail(null);
    setEditingId(null);
    setShowAddForm(false);
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await customFetch.get("/cv-templates");
      setTemplates(data.templates || []);
    } catch (error) {
      console.error(error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewThumbnail(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error("Template Name is required!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      if (editingId) {
        await customFetch.patch(`/cv-templates/admin/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("CV Template updated successfully!");
      } else {
        await customFetch.post("/cv-templates/admin", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("CV Template created successfully!");
      }
      
      handleCancel();
      fetchTemplates();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this CV Template? Students will no longer be able to use it.")) return;
    try {
      await customFetch.delete(`/cv-templates/admin/${id}`);
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 text-left animate-fade-in">
      <PageHeader
        icon={FiFileText}
        title="CV Templates"
        subtitle="Manage and upload custom resume layouts available for students."
        badge={`${templates.length} templates`}
        action={
          <button
            onClick={() => {
              if (showAddForm) {
                handleCancel();
              } else {
                setShowAddForm(true);
              }
            }}
            className="bg-[#3730a3] hover:bg-indigo-800 text-white font-extrabold py-2.5 px-5 rounded-xl transition-all duration-200 active:scale-95 inline-flex items-center gap-2 text-xs shadow-md shadow-indigo-500/10 hover:shadow-lg"
          >
            {showAddForm ? (
              <>
                <FiX className="w-4 h-4" /> Close Form
              </>
            ) : (
              <>
                <FiPlus className="w-4 h-4" /> Add CV Template
              </>
            )}
          </button>
        }
      />

      {/* Add CV Template Form Overlay/Card */}
      {showAddForm && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-md transition-all duration-300 max-w-xl mx-auto">
          <h2 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3.5 mb-5 flex items-center gap-2">
            <FiLayers className="text-[#3730a3] w-4 h-4" /> {editingId ? "Edit CV Template" : "Create New CV Template"}
          </h2>
          
          <form onSubmit={handleAddTemplate} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Template Name</label>
              <input
                type="text"
                placeholder="e.g. Modern Minimalist Tech"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition"
                required
              />
            </div>
            {/* Thumbnail Upload Section */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Template Thumbnail</label>
              <div className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-4 bg-slate-50/50 min-h-[160px] relative overflow-hidden group transition hover:border-[#3730a3]/50">
                {previewThumbnail ? (
                  <img src={previewThumbnail} alt="Thumbnail Preview" className="w-full h-full object-contain absolute inset-0 bg-white" />
                ) : (
                  <div className="text-center space-y-2 select-none pointer-events-none">
                    <FiUploadCloud className="w-7 h-7 text-slate-400 mx-auto animate-pulse" />
                    <p className="text-slate-700 text-[11px] font-bold">Select preview image</p>
                    <p className="text-[9px] text-slate-400 font-semibold">PNG, JPG, or WEBP supported</p>
                  </div>
                )}
                
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="bg-white text-slate-800 font-extrabold text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all">Change Image</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all disabled:opacity-50"
                disabled={isSubmitting}
              >
                <FiX className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                type="submit"
                className="bg-[#3730a3] hover:bg-indigo-800 text-white hover:opacity-95 font-extrabold py-2.5 px-6 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-3.5 h-3.5" /> {editingId ? "Update Template" : "Save Template"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Redesigned Templates Grid Layout */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Active Resume Layouts</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates.map((t) => (
            <div
              key={t._id}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-255 flex flex-col justify-between hover:-translate-y-1 group relative"
            >
              {/* Card visual header/thumbnail */}
              <div className="h-48 w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden relative">
                {t.thumbnail ? (
                  <img src={t.thumbnail} alt={t.name} className="w-full h-full object-contain p-2 bg-slate-50 transition-transform duration-350 group-hover:scale-[1.02]" />
                ) : (
                  <div className="text-slate-350 flex flex-col items-center gap-1.5">
                    <FiFileText className="w-10 h-10 stroke-[1.5]" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">No Image Preview</span>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-indigo-50 border border-indigo-100 text-[#3730a3] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Active
                  </span>
                </div>

                {/* Floating Action Buttons inside Card header */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleEditClick(t)}
                    className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 text-[#3730a3] rounded-xl transition shadow-sm active:scale-95"
                    title="Edit Template"
                  >
                    <FiEdit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="p-2 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-xl transition shadow-sm active:scale-95"
                    title="Delete Template"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 text-left flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug line-clamp-1 group-hover:text-[#3730a3] transition-colors">{t.name}</h4>
                  <p className="text-[10px] text-slate-455 font-semibold">
                    Added: {new Date(t.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center space-y-3">
              <FiFileText className="w-12 h-12 text-slate-350" />
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">No CV Templates Found</h4>
                <p className="text-xs text-slate-455 mt-1 max-w-xs leading-relaxed">Create your first custom design above to make it available for students.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCvTemplates;
