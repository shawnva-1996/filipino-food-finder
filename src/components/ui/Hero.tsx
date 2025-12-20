// src/components/ui/Hero.tsx
"use client";

import Link from 'next/link';
import { Search, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStores } from '@/lib/db';

export default function Hero() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [featuredStores, setFeaturedStores] = useState<any[]>([]);

  useEffect(() => {
    // Fetch only featured stores
    getStores().then(all => {
      setFeaturedStores(all.filter(s => s.isFeatured).slice(0, 3));
    });
  }, []);

  const handleSearch = () => {
    if (search.trim()) router.push(`/map?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="relative bg-white overflow-hidden pb-12">
      <div 
        className="absolute inset-0 z-0 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1569306014603-9e481b7e289e?q=80&w=2070&auto=format&fit=crop")' }} 
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-white/90"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-blue-900">
          Taste of Home <br/>
          <span className="text-red-600">in Singapore</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10 font-medium">
          Find the best <span className="text-blue-800 font-bold">Sinigang</span>, 
          <span className="text-red-600 font-bold"> Lechon</span>, and 
          <span className="text-yellow-500 font-bold drop-shadow-sm"> Halo-halo</span> near you.
        </p>

        <div className="w-full max-w-md bg-white rounded-full p-2 flex shadow-xl border border-gray-100 ring-4 ring-blue-50 mb-12">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="What are you craving? (e.g. Sisig)" 
            className="flex-grow px-6 py-3 rounded-full text-gray-900 focus:outline-none placeholder:text-gray-400"
          />
          <button onClick={handleSearch} className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg">
            <Search size={20} />
          </button>
        </div>

        {/* FEATURED STORES */}
        {featuredStores.length > 0 && (
          <div className="w-full max-w-4xl">
             <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
               <Star className="fill-yellow-400 text-yellow-400"/> Featured Spots
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {featuredStores.map(s => (
                 <Link href={`/map?q=${s.name}`} key={s.id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex flex-col items-center">
                   {s.imageUrl ? (
                     <img src={s.imageUrl} className="w-full h-32 object-cover rounded-lg mb-3" />
                   ) : (
                     <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400">No Image</div>
                   )}
                   <h4 className="font-bold text-lg text-blue-900">{s.name}</h4>
                   <p className="text-sm text-gray-500">{s.address}</p>
                   <div className="flex items-center gap-1 mt-2 text-yellow-600 font-bold text-sm">
                     <Star size={14} fill="currentColor"/> {s.rating?.toFixed(1) || "New"}
                   </div>
                 </Link>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}