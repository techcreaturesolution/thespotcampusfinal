import React, { useState, useEffect } from "react";
import { FiX, FiEye, FiEyeOff, FiUser } from "react-icons/fi";

const AddTpoModal = ({ isOpen, onClose, degrees = [], onSubmit, tpo = null }) => {
  const [form, setForm] = useState({
    tpo_name: "",
    tpo_email: "",
    tpo_contact: "",
    tpo_password: "",
    tpo_degree_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (tpo) {
        setForm({
          tpo_name: tpo.tpo_name || "",
          tpo_email: tpo.tpo_email || "",
          tpo_contact: tpo.tpo_contact || "",
          tpo_password: "",
          tpo_degree_id: tpo.tpo_degree_id?._id || tpo.tpo_degree_id || "",
        });
      } else {
        setForm({
          tpo_name: "",
          tpo_email: "",
          tpo_contact: "",
          tpo_password: "",
          tpo_degree_id: "",
        });
      }
    }
  }, [tpo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        tpo_degree_id: form.tpo_degree_id || undefined,
      };
      await onSubmit(payload);
      setForm({
        tpo_name: "",
        tpo_email: "",
        tpo_contact: "",
        tpo_password: "",
        tpo_degree_id: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FiUser className="text-[#3730a3] w-4.5 h-4.5" /> {tpo ? "Edit Placement Officer (TPO)" : "Register Placement Officer (TPO)"}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg transition">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-505 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Rajesh Sharma"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition bg-white"
              value={form.tpo_name}
              onChange={(e) => setForm({ ...form, tpo_name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-extrabold text-slate-505 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              placeholder="tpo@college.edu"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition bg-white"
              value={form.tpo_email}
              onChange={(e) => setForm({ ...form, tpo_email: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-extrabold text-slate-505 uppercase tracking-wider mb-2">Contact Number</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition bg-white"
              value={form.tpo_contact}
              onChange={(e) => setForm({ ...form, tpo_contact: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-505 uppercase tracking-wider mb-2">Assigned Degree Focus</label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 bg-white cursor-pointer transition"
              value={form.tpo_degree_id}
              onChange={(e) => setForm({ ...form, tpo_degree_id: e.target.value })}
            >
              <option value="">All Degrees (Campus-wide TPO)</option>
              {degrees.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.degree_name} ({d.degree_code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] font-extrabold text-slate-505 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={tpo ? "Leave blank to keep current" : "••••••••"}
                className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3730a3] focus:border-[#3730a3] outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition bg-white"
                value={form.tpo_password}
                onChange={(e) => setForm({ ...form, tpo_password: e.target.value })}
                required={!tpo}
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-50 text-slate-755 font-bold py-2 px-4 rounded-xl border border-slate-200 transition text-xs shadow-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#3730a3] hover:bg-indigo-750 text-white font-bold py-2 px-4 rounded-xl transition shadow-md shadow-indigo-500/10 text-xs flex items-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : (tpo ? "Save Changes" : "Add TPO")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTpoModal;
