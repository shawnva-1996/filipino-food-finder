// src/components/forms/BusinessForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Loader2, ImagePlus, CheckCircle } from "lucide-react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";

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

// Internal component to handle the Google Maps Logic
function AddressInput({ address, setAddress, setVerifiedLocation }: any) {
  const placesLib = useMapsLibrary('places'); // Hook to ensure library is loaded
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: "sg" },
      fields: ['geometry', 'formatted_address', 'name']
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setVerifiedLocation({ 
          lat: place.geometry.location.lat(), 
          lng: place.geometry.location.lng() 
        });
        setAddress(place.formatted_address || place.name || "");
      }
    });
  }, [placesLib, setAddress, setVerifiedLocation]);

  return (
    <input 
      ref={inputRef}
      required 
      className="w-full border p-2 rounded" 
      placeholder="e.g. 10 Tampines Central 1" 
      value={address} 
      onChange={e => { setAddress(e.target.value); setVerifiedLocation(null); }} 
    />
  );
}

export default function BusinessForm({ initialData, storeId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  
  const [verifiedLocation, setVerifiedLocation] = useState<{lat: number, lng: number} | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !verifiedLocation) return alert("Please select a valid address from the dropdown.");
    setLoading(true);

    try {
      const storage = getStorage();
      
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        const storageRef = ref(storage, `stores/${user.uid}/cover_${Date.now()}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

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
        setLoading(false);
        setShowPendingModal(true);
      }
    } catch (error) {
      console.error(error);
      alert("Error saving.");
      setLoading(false);
    }
  };

  if (showPendingModal) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
             <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for registering. Our Super Admin is currently reviewing your application. 
            This usually takes <strong>3 to 5 business days</strong>.
          </p>
          <button onClick={() => router.push("/my-business")} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
            Got it, take me to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""} libraries={['places']}>
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

        <div>
            <label className="block text-sm font-medium mb-1">Address (Start typing to search)</label>
            <AddressInput 
              address={formData.address} 
              setAddress={(val: string) => setFormData(prev => ({...prev, address: val}))} 
              setVerifiedLocation={setVerifiedLocation}
            />
            {verifiedLocation && <p className="text-green-600 text-xs mt-1">✓ Location Verified</p>}
        </div>

        {/* MENU SECTION */}
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
    </APIProvider>
  );
}