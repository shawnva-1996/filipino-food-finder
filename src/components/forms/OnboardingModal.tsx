// src/components/forms/OnboardingModal.tsx
"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/db";
import { Loader2 } from "lucide-react";

export default function OnboardingModal() {
  const { user, profile, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "" });
  const [loading, setLoading] = useState(false);

  // If not logged in OR already has profile data, hide modal
  if (!user || (profile?.phoneNumber && profile?.firstName)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        uid: user.uid,
        email: user.email!,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phone,
        favorites: profile?.favorites || []
      });
      await refreshProfile();
    } catch (error) {
      console.error(error);
      alert("Error saving profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-2">Welcome to Filipino Food Finder</h2>
        <p className="text-gray-500 mb-6">Please complete your profile to continue.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input required className="w-full border p-2 rounded" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
             </div>
             <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input required className="w-full border p-2 rounded" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input required type="tel" placeholder="+65 9123 4567" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}