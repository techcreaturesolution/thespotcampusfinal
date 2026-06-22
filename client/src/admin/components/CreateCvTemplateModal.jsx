import React, { useState, useEffect } from "react";
import { FiX, FiLayers, FiUploadCloud, FiCheck } from "react-icons/fi";

const CreateCvTemplateModal = ({ isOpen, onClose, template, onSubmit, isSubmitting }) => {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewThumbnail, setPreviewThumbnail] = useState(null);

  useEffect(() => {
    if (template) {
      setName(template.name || "");
      setPreviewThumbnail(template.thumbnail || null);
      setThumbnailFile(null);
    } else {
      setName("");
      setPreviewThumbnail(null);
      setThumbnailFile(null);
    }
  }, [template]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(name, thumbnailFile);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-200 animate-fade-in text-left">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FiLayers className="text-[#3730a3] w-5 h-5" />
            {template ? "Edit CV Template" : "Create New CV Template"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Template Name
            </label>
            <input
              type="text"
              placeholder="e.g. Modern Minimalist Tech"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3] transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Template Thumbnail
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-4 bg-slate-50/50 min-h-[160px] relative overflow-hidden group transition hover:border-[#3730a3]/50">
              {previewThumbnail ? (
                <img
                  src={previewThumbnail}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-contain absolute inset-0 bg-white"
                />
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
                <span className="bg-white text-slate-800 font-extrabold text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all">
                  Change Image
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
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
                  <FiCheck className="w-3.5 h-3.5" /> {template ? "Update Template" : "Save Template"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCvTemplateModal;
