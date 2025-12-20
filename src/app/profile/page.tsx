// src/app/profile/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { updateUserProfile } from "@/lib/db";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phoneNumber: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phoneNumber: profile.phoneNumber || ""
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, formData);
      await refreshProfile();
      alert("Profile updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center">Please login to view your profile.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm">
        <div className="flex items-center gap-4 mb-6">
           {user.photoURL ? <img src={user.photoURL} className="w-16 h-16 rounded-full border" /> : <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">{user.displayName?.[0]}</div>}
           <div>
             <h1 className="text-2xl font-bold">{user.displayName || "My Profile"}</h1>
             <p className="text-gray-500 text-sm">{user.email}</p>
             <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded uppercase font-bold">{profile?.role || "User"}</span>
           </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-bold mb-1">First Name</label>
               <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
               <label className="block text-sm font-bold mb-1">Last Name</label>
               <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full border p-2 rounded" />
            </div>
          </div>
          <div>
             <label className="block text-sm font-bold mb-1">Phone Number</label>
             <input required type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded font-bold flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}