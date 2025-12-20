// src/components/forms/BusinessForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Loader2, ImagePlus } from "lucide-react";

interface Props {
  initialData?: any;
  storeId?: string;
}

const DEFAULT_FORM = {
  name: "", address: "", category: "Restaurant", description: "", contactNumber: "",
  priceRange: "$", region: "General", isHalal: false, keywordsString: "",
  menuUrl: "", imageUrl: "", menuText: "",
  websiteUrl: "", tiktokUrl: "", facebookUrl: "", instagramUrl: ""
};

export default function BusinessForm({ initialData, storeId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [verifiedLocation, setVerifiedLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // File States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuType, setMenuType] = useState<"text" | "image">("text");

  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...DEFAULT_FORM, ...initialData, 
        keywordsString: initialData.keywords ? initialData.keywords.join(", ") : "" 
      });
      if (initialData.lat && initialData.lng) {
        setVerifiedLocation({ lat: initialData.lat, lng: initialData.lng });
      }
      if (initialData.menuUrl) setMenuType("image");
      else if (initialData.menuText) setMenuType("text");
    } else {
      setFormData(DEFAULT_FORM);
      setVerifiedLocation(null);
    }
  }, [initialData]);

  const handleVerifyLocation = async () => {
    if (!formData.address) { alert("Address needed"); return; }
    setGeocoding(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formData.address + " Singapore")}&key=${apiKey}`);
      const data = await res.json();
      if (data.status === "OK") {
        const loc = data.results[0].geometry.location;
        setVerifiedLocation({ lat: loc.lat, lng: loc.lng });
      } else { alert("Location not found"); }
    } catch (e) { console.error(e); } finally { setGeocoding(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !verifiedLocation) return alert("Verify location or login.");
    setLoading(true);

    try {
      const storage = getStorage();
      
      // 1. Upload Store Image
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        const storageRef = ref(storage, `stores/${user.uid}/cover_${Date.now()}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      // 2. Upload Menu Image (if selected)
      let finalMenuUrl = formData.menuUrl;
      if (menuType === "image" && menuImageFile) {
        const menuRef = ref(storage, `stores/${user.uid}/menu_${Date.now()}`);
        await uploadBytes(menuRef, menuImageFile);
        finalMenuUrl = await getDownloadURL(menuRef);
      }

      const keywords = formData.keywordsString.split(",").map((k: string) => k.trim()).filter((k: string) => k.length > 0);
      
      const dataToSave = {
        name: formData.name,
        address: formData.address,
        category: formData.category,
        description: formData.description,
        contactNumber: formData.contactNumber,
        priceRange: formData.priceRange,
        region: formData.region,
        isHalal: formData.isHalal,
        websiteUrl: formData.websiteUrl || "",
        facebookUrl: formData.facebookUrl || "",
        instagramUrl: formData.instagramUrl || "",
        tiktokUrl: formData.tiktokUrl || "",
        
        // Menu Logic: Clear the one we aren't using
        menuUrl: menuType === "image" ? (finalMenuUrl || "") : "",
        menuText: menuType === "text" ? formData.menuText : "",
        
        imageUrl: finalImageUrl || "",
        keywords,
        lat: verifiedLocation.lat,
        lng: verifiedLocation.lng
      };

      if (storeId) {
        await updateDoc(doc(db, "stores", storeId), dataToSave);
        alert("Updated successfully!");
        router.push("/my-business");
      } else {
        await addDoc(collection(db, "stores"), {
          ...dataToSave,
          ownerId: user.uid,
          ownerEmail: user.email,
          createdAt: serverTimestamp(),
          status: "pending",
          rating: 0, ratingTotal: 0, reviewsCount: 0, views: 0, whatsappClicks: 0
        });
        alert("Registration successful!");
        router.push("/my-business");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-4">{storeId ? "Edit Business" : "Register New Business"}</h2>

      <div className="mb-4">
         <label className="block text-sm font-medium mb-1">Store Photo</label>
         <div className="flex items-center gap-4">
           {formData.imageUrl && <img src={formData.imageUrl} className="w-16 h-16 rounded object-cover" alt="Current" />}
           <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-200">
             <ImagePlus size={20} />
             {imageFile ? "Selected: " + imageFile.name : "Upload Photo"}
             <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setImageFile(e.target.files[0])} />
           </label>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input required className="border p-2 rounded" placeholder="Business Name" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
        <input required className="border p-2 rounded" placeholder="Contact (+65...)" value={formData.contactNumber} onChange={e=>setFormData({...formData, contactNumber: e.target.value})} />
      </div>

      <div className="flex gap-2 mb-2">
          <input required className="flex-grow border p-2 rounded" placeholder="Address (Type & Click Verify)" value={formData.address} onChange={e=>{setFormData({...formData, address: e.target.value}); setVerifiedLocation(null)}} />
          <button type="button" onClick={handleVerifyLocation} disabled={geocoding} className={`px-4 rounded text-sm ${verifiedLocation ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>
             {geocoding ? "..." : verifiedLocation ? "✓ Verified" : "Verify"}
          </button>
      </div>

      {/* MENU SECTION: Choice Logic */}
      <div className="border p-4 rounded-lg bg-gray-50">
        <label className="block text-sm font-bold mb-2">Menu Format</label>
        <div className="flex gap-4 mb-3">
          <button type="button" onClick={() => setMenuType("text")} className={`px-4 py-2 rounded text-sm ${menuType === "text" ? "bg-blue-600 text-white" : "bg-white border"}`}>Text List</button>
          <button type="button" onClick={() => setMenuType("image")} className={`px-4 py-2 rounded text-sm ${menuType === "image" ? "bg-blue-600 text-white" : "bg-white border"}`}>Image Upload</button>
        </div>

        {menuType === "text" ? (
          <textarea className="w-full border p-2 rounded" rows={4} placeholder="e.g. Lechon - $15, Sinigang - $10" value={formData.menuText} onChange={e=>setFormData({...formData, menuText: e.target.value})} />
        ) : (
          <div className="flex items-center gap-4">
             {formData.menuUrl && <img src={formData.menuUrl} className="h-20 w-auto border rounded" />}
             <label className="cursor-pointer bg-white border px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-100">
               <ImagePlus size={20} />
               {menuImageFile ? "File: " + menuImageFile.name : "Upload Menu Image"}
               <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setMenuImageFile(e.target.files[0])} />
             </label>
          </div>
        )}
      </div>

      <h3 className="font-bold text-sm mt-4">Social Media (Optional)</h3>
      <div className="grid grid-cols-2 gap-2">
        <input className="border p-2 rounded" placeholder="Website URL" value={formData.websiteUrl} onChange={e=>setFormData({...formData, websiteUrl: e.target.value})} />
        <input className="border p-2 rounded" placeholder="Facebook URL" value={formData.facebookUrl} onChange={e=>setFormData({...formData, facebookUrl: e.target.value})} />
        <input className="border p-2 rounded" placeholder="Instagram URL" value={formData.instagramUrl} onChange={e=>setFormData({...formData, instagramUrl: e.target.value})} />
        <input className="border p-2 rounded" placeholder="TikTok URL" value={formData.tiktokUrl} onChange={e=>setFormData({...formData, tiktokUrl: e.target.value})} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <select className="border p-2 rounded" value={formData.priceRange} onChange={e=>setFormData({...formData, priceRange: e.target.value})}>
           <option value="$">$</option><option value="$$">$$</option><option value="$$$">$$$</option>
        </select>
        <select className="border p-2 rounded" value={formData.region} onChange={e=>setFormData({...formData, region: e.target.value})}>
           <option value="General">General</option><option value="Kapampangan">Kapampangan</option><option value="Ilocano">Ilocano</option><option value="Bisaya">Bisaya</option><option value="Bicolano">Bicolano</option><option value="Tagalog">Tagalog</option>
        </select>
      </div>

      <input className="w-full border p-2 rounded mt-2" placeholder="Keywords (e.g. Sisig)" value={formData.keywordsString} onChange={e=>setFormData({...formData, keywordsString: e.target.value})} />
      <textarea required className="w-full border p-2 rounded mt-2" rows={2} placeholder="Description" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} />

      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded font-bold">
        {loading ? "Saving..." : "Save Business"}
      </button>
    </form>
  );
}