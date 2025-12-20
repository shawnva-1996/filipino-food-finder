// src/components/forms/BusinessForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Loader2, ImagePlus, CheckCircle, Trash2, Plus, X, Pencil, Eye, EyeOff } from "lucide-react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";

interface MenuItem {
  name: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
  imageFile?: File; // Temp for upload
}

interface Props {
  initialData?: any;
  storeId?: string;
}

const DEFAULT_FORM = {
  name: "", address: "", category: "Restaurant", description: "", contactNumber: "",
  priceRange: "$", region: "General", isHalal: false, keywordsString: "",
  menuUrl: "", imageUrl: "", 
  websiteUrl: "", tiktokUrl: "", facebookUrl: "", instagramUrl: "",
  nearestMrt: "", walkingTime: ""
};

function AddressInput({ address, setAddress, setVerifiedLocation }: any) {
  const placesLib = useMapsLibrary('places');
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

  // Files
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [foodImageFiles, setFoodImageFiles] = useState<File[]>([]);
  
  // Data State
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [existingFoodImages, setExistingFoodImages] = useState<string[]>([]);

  // Menu Builder State
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); 

  useEffect(() => {
    if (initialData) {
      setFormData({ ...DEFAULT_FORM, ...initialData, 
        keywordsString: initialData.keywords ? initialData.keywords.join(", ") : "" 
      });
      if (initialData.lat && initialData.lng) {
        setVerifiedLocation({ lat: initialData.lat, lng: initialData.lng });
      }
      // Ensure existing items have availability status
      if (initialData.menuItems) {
        setMenuItems(initialData.menuItems.map((m: MenuItem) => ({
          ...m, 
          isAvailable: m.isAvailable !== undefined ? m.isAvailable : true
        })));
      }
      if (initialData.foodImages) setExistingFoodImages(initialData.foodImages);
    } else {
      setFormData(DEFAULT_FORM);
      setVerifiedLocation(null);
    }
  }, [initialData]);

  const addOrUpdateMenuItem = () => {
    if (!newItemName || !newItemPrice) return alert("Enter item name and price");
    
    const newItem: MenuItem = { 
      name: newItemName, 
      price: parseFloat(newItemPrice),
      isAvailable: true, // Default to true
      imageFile: newItemImage || undefined,
      imageUrl: editingIndex !== null ? menuItems[editingIndex].imageUrl : undefined
    };

    if (editingIndex !== null) {
      // Preserve availability status on edit unless changed elsewhere
      newItem.isAvailable = menuItems[editingIndex].isAvailable;
      
      const updated = [...menuItems];
      updated[editingIndex] = newItem;
      setMenuItems(updated);
      setEditingIndex(null);
    } else {
      setMenuItems([...menuItems, newItem]);
    }

    setNewItemName("");
    setNewItemPrice("");
    setNewItemImage(null);
  };

  const editMenuItem = (index: number) => {
    const item = menuItems[index];
    setNewItemName(item.name);
    setNewItemPrice(item.price.toString());
    setEditingIndex(index);
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const toggleAvailability = (index: number) => {
    const updated = [...menuItems];
    updated[index].isAvailable = !updated[index].isAvailable;
    setMenuItems(updated);
  };

  const handleCancel = () => {
    if(confirm("Discard changes?")) router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !verifiedLocation) return alert("Please select a valid address from the dropdown.");
    setLoading(true);

    try {
      const storage = getStorage();
      
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        const ref1 = ref(storage, `stores/${user.uid}/cover_${Date.now()}`);
        await uploadBytes(ref1, imageFile);
        finalImageUrl = await getDownloadURL(ref1);
      }

      const newFoodUrls = [];
      for (const file of foodImageFiles) {
        const ref2 = ref(storage, `stores/${user.uid}/food_${Date.now()}_${file.name}`);
        await uploadBytes(ref2, file);
        const url = await getDownloadURL(ref2);
        newFoodUrls.push(url);
      }
      const finalFoodImages = [...existingFoodImages, ...newFoodUrls];

      const processedMenuItems = [];
      for (const item of menuItems) {
        let itemUrl = item.imageUrl || "";
        if (item.imageFile) {
          const ref3 = ref(storage, `stores/${user.uid}/menu_item_${Date.now()}_${item.name}`);
          await uploadBytes(ref3, item.imageFile);
          itemUrl = await getDownloadURL(ref3);
        }
        processedMenuItems.push({
          name: item.name,
          price: item.price,
          isAvailable: item.isAvailable,
          imageUrl: itemUrl
        });
      }

      const keywords = formData.keywordsString.split(",").map((k: string) => k.trim()).filter((k: string) => k.length > 0);
      
      const dataToSave = {
        ...formData,
        imageUrl: finalImageUrl || "",
        foodImages: finalFoodImages,
        menuItems: processedMenuItems,
        keywords,
        lat: verifiedLocation.lat,
        lng: verifiedLocation.lng,
        lastUpdated: serverTimestamp()
      };

      delete (dataToSave as any).keywordsString;

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
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white p-8 rounded-xl max-w-md w-full text-center shadow-2xl relative">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
             <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for registering. Our Super Admin is currently reviewing your application. 
            This usually takes <strong>3 to 5 business days</strong>.
          </p>
          <button 
            type="button"
            onClick={() => { setShowPendingModal(false); router.push("/my-business"); }} 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 cursor-pointer"
          >
            Got it, take me to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""} libraries={['places']}>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center border-b pb-4">
           <h2 className="text-xl font-bold text-gray-900">{storeId ? "Edit Business" : "Register New Business"}</h2>
           <button type="button" onClick={handleCancel} className="text-red-600 text-sm hover:underline font-bold">Cancel Changes</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-sm font-bold mb-2">Business Name</label>
              <input required className="w-full border p-2 rounded" placeholder="e.g. Kabayan Kitchen" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
           </div>
           <div>
              <label className="block text-sm font-bold mb-2">Contact Number</label>
              <input required className="w-full border p-2 rounded" placeholder="+65 9123 4567" value={formData.contactNumber} onChange={e=>setFormData({...formData, contactNumber: e.target.value})} />
           </div>
        </div>

        <div>
            <label className="block text-sm font-bold mb-2">Address (Type to Search)</label>
            <AddressInput 
              address={formData.address} 
              setAddress={(val: string) => setFormData(prev => ({...prev, address: val}))} 
              setVerifiedLocation={setVerifiedLocation}
            />
            {verifiedLocation && <p className="text-green-600 text-xs mt-1 font-bold">✓ Location Verified</p>}
        </div>

        <div className="grid grid-cols-2 gap-6">
           <div>
              <label className="block text-sm font-bold mb-2">Nearest MRT Station</label>
              <input className="w-full border p-2 rounded" placeholder="e.g. Toa Payoh" value={formData.nearestMrt} onChange={e=>setFormData({...formData, nearestMrt: e.target.value})} />
           </div>
           <div>
              <label className="block text-sm font-bold mb-2">Walking Time</label>
              <input className="w-full border p-2 rounded" placeholder="e.g. 10 mins" value={formData.walkingTime} onChange={e=>setFormData({...formData, walkingTime: e.target.value})} />
           </div>
        </div>

        <div>
           <label className="block text-sm font-bold mb-2">Cover Image (Required)</label>
           <div className="flex items-center gap-4 mb-4">
             {formData.imageUrl && <img src={formData.imageUrl} className="w-20 h-20 rounded object-contain border bg-gray-100" alt="Cover" />}
             <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-200">
               <ImagePlus size={20} /> Change Cover
               <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setImageFile(e.target.files[0])} />
             </label>
           </div>

           <label className="block text-sm font-bold mb-2">Food Gallery (Carousel)</label>
           <div className="flex gap-2 overflow-x-auto pb-2">
              {existingFoodImages.map((url, i) => (
                <div key={i} className="relative flex-shrink-0">
                   <img src={url} className="w-20 h-20 rounded object-contain border bg-gray-100" />
                   <button type="button" onClick={() => setExistingFoodImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5"><Trash2 size={12}/></button>
                </div>
              ))}
              <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 flex-shrink-0">
                 <Plus size={24} className="text-gray-400" />
                 <span className="text-[10px] text-gray-500">Add Photos</span>
                 <input type="file" multiple accept="image/*" className="hidden" onChange={e => e.target.files && setFoodImageFiles(Array.from(e.target.files))} />
              </label>
           </div>
        </div>

        {/* --- MENU BUILDER --- */}
        <div className="border p-4 rounded-xl bg-gray-50">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2">Menu Builder</h3>
           
           <div className="flex flex-col gap-2 mb-4 bg-white p-3 rounded border">
              <div className="flex gap-2">
                <input className="flex-grow border p-2 rounded" placeholder="Item Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                <input type="number" className="w-24 border p-2 rounded" placeholder="Price $" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                 <label className="flex-grow flex items-center gap-2 cursor-pointer bg-gray-100 p-2 rounded text-sm text-gray-600 hover:bg-gray-200">
                    <ImagePlus size={16}/> 
                    {newItemImage ? newItemImage.name : "Upload Item Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setNewItemImage(e.target.files[0])} />
                 </label>
                 <button type="button" onClick={addOrUpdateMenuItem} className={`text-white px-6 py-2 rounded font-bold ${editingIndex !== null ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}>
                   {editingIndex !== null ? "Update" : "Add"}
                 </button>
                 {editingIndex !== null && (
                   <button type="button" onClick={() => { setEditingIndex(null); setNewItemName(""); setNewItemPrice(""); }} className="text-gray-500 hover:text-gray-700 p-2"><X size={20}/></button>
                 )}
              </div>
           </div>

           <div className="space-y-2">
              {menuItems.map((item, idx) => (
                <div key={idx} className={`flex justify-between items-center bg-white p-2 rounded border shadow-sm ${editingIndex === idx ? "border-orange-500 ring-1 ring-orange-500" : ""} ${!item.isAvailable ? "opacity-60 bg-gray-100" : ""}`}>
                   <div className="flex items-center gap-3">
                      {item.imageUrl ? <img src={item.imageUrl} className="w-10 h-10 rounded object-contain bg-gray-100" /> : 
                       item.imageFile ? <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-[10px]">New</div> : 
                       <div className="w-10 h-10 bg-gray-100 rounded"/>}
                      <div>
                        <span className="font-medium block">{item.name}</span>
                        <span className="text-xs text-gray-500">${item.price.toFixed(2)}</span>
                        {!item.isAvailable && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold ml-2">SOLD OUT</span>}
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <button type="button" onClick={() => toggleAvailability(idx)} className={`p-2 rounded ${item.isAvailable ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-200"}`} title={item.isAvailable ? "Mark Sold Out" : "Mark Available"}>
                        {item.isAvailable ? <Eye size={16}/> : <EyeOff size={16}/>}
                      </button>
                      <button type="button" onClick={() => editMenuItem(idx)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Pencil size={16}/></button>
                      <button type="button" onClick={() => removeMenuItem(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                   </div>
                </div>
              ))}
              {menuItems.length === 0 && <p className="text-center text-gray-400 text-sm">No items added yet.</p>}
           </div>
        </div>

        <h3 className="font-bold text-sm mt-4">Social Media (Optional)</h3>
        <div className="grid grid-cols-2 gap-4">
          <input className="border p-2 rounded" placeholder="Website URL" value={formData.websiteUrl} onChange={e=>setFormData({...formData, websiteUrl: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Facebook URL" value={formData.facebookUrl} onChange={e=>setFormData({...formData, facebookUrl: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Instagram URL" value={formData.instagramUrl} onChange={e=>setFormData({...formData, instagramUrl: e.target.value})} />
          <input className="border p-2 rounded" placeholder="TikTok URL" value={formData.tiktokUrl} onChange={e=>setFormData({...formData, tiktokUrl: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
             <label className="block text-sm font-bold mb-1">Cuisine Region</label>
             <select className="w-full border p-2 rounded" value={formData.region} onChange={e=>setFormData({...formData, region: e.target.value})}>
                <option value="General">General</option><option value="Kapampangan">Kapampangan</option><option value="Ilocano">Ilocano</option><option value="Bisaya">Bisaya</option><option value="Bicolano">Bicolano</option><option value="Tagalog">Tagalog</option>
             </select>
          </div>
          <div>
             <label className="block text-sm font-bold mb-1">Keywords</label>
             <input className="w-full border p-2 rounded" placeholder="e.g. Sisig, Lechon" value={formData.keywordsString} onChange={e=>setFormData({...formData, keywordsString: e.target.value})} />
          </div>
        </div>

        <div className="mt-4">
           <label className="block text-sm font-bold mb-1">Description</label>
           <textarea required className="w-full border p-2 rounded" rows={3} placeholder="Tell us about your food..." value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg">
          {loading ? "Saving..." : "Save Business"}
        </button>
      </form>
    </APIProvider>
  );
}