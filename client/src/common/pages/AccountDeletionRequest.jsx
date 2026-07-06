import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiAlertTriangle, FiTrash2, FiExternalLink } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AccountDeletionRequest = () => {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleProceed = () => {
    if (agreed) {
      window.open(
        "https://docs.google.com/forms/d/e/1FAIpQLSd3SwXHH1vDNsZx9H9i35CTleSuuLVi480cI4_1z_botikvgg/viewform?usp=publish-editor",
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col justify-between selection:bg-[#3730a3] selection:text-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-[#3730a3] font-bold text-sm mb-6 transition duration-150 active:scale-95"
          >
            <FiArrowLeft className="w-4 h-4" /> Go Back
          </button>

          {/* Account Deletion Request Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-indigo-950/5 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                <FiAlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight text-left">
                  Account Deletion Request
                </h1>
                <p className="text-xs text-slate-400 font-semibold mt-0.5 text-left">
                  Permanently remove your profile & user information
                </p>
              </div>
            </div>

            {/* Warning Details */}
            <div className="space-y-5 text-slate-600 text-sm leading-relaxed text-left">
              <p className="font-semibold text-slate-800">
                You are initiating a request to permanently delete your account and remove all personal information associated with your profile from The Spot Campus platform.
              </p>

              <div className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-5 space-y-2.5">
                <h3 className="text-xs font-black text-rose-700 uppercase tracking-wider">
                  What will be permanently deleted:
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs font-medium">
                  <li>Your personal profile details (Full name, Email address, Contact details, College/Institute metadata).</li>
                  <li>All compiled resumes, custom portfolio structures, and uploaded PDF template documents.</li>
                  <li>Your placement portal application history, bookmarks, and mock test practice records.</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2.5">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  What might be retained for compliance:
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-500 text-xs font-medium">
                  <li>Completed academic exam records and proctoring/cheat-detection audits.</li>
                  <li>Billing invoices and financial transaction logs (for payment audits).</li>
                </ul>
              </div>

              <p className="text-slate-400 text-xs leading-normal">
                Please note: Account deletion requests are processed manually by our operations desk within **7-14 business days**. Once your data is deleted, this action cannot be undone, and you will lose permanent access to all portals.
              </p>

              {/* Agreement Checkbox */}
              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 text-rose-600 border-slate-300 rounded focus:ring-rose-500 transition cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-800 font-bold leading-normal">
                    I understand that this action is permanent and irreversible, and I agree to proceed with the deletion request form.
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-5 border-t border-slate-100">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-[#f8f9ff] text-[#3730a3] hover:bg-indigo-50 border border-indigo-100 font-extrabold py-3.5 px-6 rounded-xl text-sm transition duration-200 active:scale-98"
              >
                Cancel & Keep Account
              </button>
              <button
                onClick={handleProceed}
                disabled={!agreed}
                className={`flex-1 flex items-center justify-center gap-2 font-extrabold py-3.5 px-6 rounded-xl text-sm transition duration-200 ${
                  agreed
                    ? "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/10 hover:shadow-xl active:scale-98"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}
              >
                <FiTrash2 className="w-4 h-4" /> Proceed to Request <FiExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AccountDeletionRequest;
