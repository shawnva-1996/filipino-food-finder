// src/app/favorites/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getStores } from "@/lib/db";
import Link from "next/link";
import { MapPin, Star, Heart } from "lucide-react";

export default function FavoritesPage() {
  const { profile, loading } = useAuth();
  const [favStores, setFavStores] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (profile?.favorites) {
      getStores().then(all => {
        setFavStores(all.filter(s => profile.favorites?.includes(s.id)));
        setFetching(false);
      });
    } else {
      setFetching(false);
    }
  }, [profile]);

  if (loading || fetching) return <div className="p-10 text-center">Loading your cravings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-900 flex items-center gap-2">
          <Heart className="fill-red-500 text-red-500" /> My Favorites
        </h1>
        
        {favStores.length === 0 ? (
          <div className="bg-white p-10 rounded-xl text-center border border-dashed">
            <p className="text-gray-500 mb-4">You haven't saved any restaurants yet.</p>
            <Link href="/map" className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold">Find Food</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favStores.map(s => (
               <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                 <div>
                   <div className="flex justify-between items-start">
                     <h2 className="font-bold text-lg">{s.name}</h2>
                     <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-xs font-bold text-yellow-700">
                       <Star size={12} fill="currentColor" /> {s.rating?.toFixed(1) || "New"}
                     </div>
                   </div>
                   <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                     <MapPin size={14} /> {s.address}
                   </p>
                   {s.category && <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-1 rounded">{s.category}</span>}
                 </div>
                 
                 <div className="mt-4 pt-4 border-t flex justify-end">
                   <Link href={`/map?q=${encodeURIComponent(s.name)}`} className="text-blue-600 font-bold text-sm hover:underline">
                     View on Map →
                   </Link>
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}