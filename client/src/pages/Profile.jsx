import React from "react";
import { useOutletContext } from "react-router-dom";
import { FiUser } from "react-icons/fi";

const Profile = () => {
  const { user, role } = useOutletContext();
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
            {(user?.student_name || user?.company_name || "U")[0]}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.student_name || user?.company_name || user?.admin_name || "User"}</h2>
            <p className="text-gray-500">{role}</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Email</span><span className="font-medium">{user?.student_email || user?.company_email || user?.admin_email || "-"}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Contact</span><span className="font-medium">{user?.student_contact || user?.company_contact || "-"}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Role</span><span className="font-medium">{role}</span></div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
