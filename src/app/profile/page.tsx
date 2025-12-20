// src/app/profile/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { updateUserProfile } from "@/lib/db";
import { Loader2, Camera, Lock } from "lucide-react";
import { updatePassword, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phoneNumber: "" });
  const [loading, setLoading] = useState(false);
  
  const [newPassword, setNewPassword] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

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
      let photoURL = user.photoURL;

      // 1. Upload new image if selected
      if (imageFile) {
        const storage = getStorage();
        const fileRef = ref(storage, `users/${user.uid}/profile_${Date.now()}`);
        await uploadBytes(fileRef, imageFile);
        photoURL = await getDownloadURL(fileRef);
        // Update Firebase Auth Profile
        await updateProfile(user, { photoURL });
      }

      // 2. Update Firestore Data
      await updateUserProfile(user.uid, formData);

      // 3. Update Password if provided
      if (newPassword) {
        if (newPassword.length < 6) throw new Error("Password must be 6+ chars");
        await updatePassword(user, newPassword);
        setNewPassword(""); // Clear
        alert("Password updated!");
      }

      await refreshProfile();
      alert("Profile saved successfully!");
    } catch (e: any) {
      console.error(e);
      alert("Error: " + e.message + " (If changing password, try re-logging in first)");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center">Please login to view your profile.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm">
        
        {/* Profile Header & Image Upload */}
        <div className="flex flex-col items-center mb-8">
           <div className="relative group">
             {imageFile ? (
               <img src={URL.createObjectURL(imageFile)} className="w-24 h-24 rounded-full object-cover border-2 border-blue-500" />
             ) : user.photoURL ? (
               <img src={user.photoURL} className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
             ) : (
               <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">{user.displayName?.[0] || "U"}</div>
             )}
             
             <label className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow border cursor-pointer hover:bg-gray-100">
               <Camera size={16} className="text-gray-600"/>
               <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setImageFile(e.target.files[0])} />
             </label>
           </div>
           
           <h1 className="text-xl font-bold mt-2">{user.displayName || "My Profile"}</h1>
           <p className="text-gray-500 text-sm">{user.email}</p>
           <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded uppercase font-bold mt-1">{profile?.role || "User"}</span>
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

          <hr className="my-4 border-gray-200" />
          
          <div>
             <label className="block text-sm font-bold mb-1 flex items-center gap-1"><Lock size={14}/> Change Password (Optional)</label>
             <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded bg-gray-50 focus:bg-white transition-colors" />
          </div>

          <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded font-bold flex justify-center mt-4">
            {loading ? <Loader2 className="animate-spin" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}