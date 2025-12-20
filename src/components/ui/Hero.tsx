// src/components/ui/Hero.tsx
"use client";

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    if (search.trim()) {
      router.push(`/map?q=${encodeURIComponent(search)}`);
    }
  };

  return (
    <div className="relative bg-white overflow-hidden">
      
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

        {/* Search Bar */}
        <div className="w-full max-w-md bg-white rounded-full p-2 flex shadow-xl border border-gray-100 ring-4 ring-blue-50">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="What are you craving? (e.g. Sisig)" 
            className="flex-grow px-6 py-3 rounded-full text-gray-900 focus:outline-none placeholder:text-gray-400"
          />
          <button 
            onClick={handleSearch}
            className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg"
          >
            <Search size={20} />
          </button>
        </div>

        <div className="mt-8 flex gap-4 text-sm font-semibold text-blue-900/80">
          <span>Popular:</span>
          <span className="cursor-pointer hover:text-red-600 underline decoration-yellow-400 decoration-2 underline-offset-4">Jollibee</span>
          <span className="cursor-pointer hover:text-red-600 underline decoration-yellow-400 decoration-2 underline-offset-4">Lechon</span>
          <span className="cursor-pointer hover:text-red-600 underline decoration-yellow-400 decoration-2 underline-offset-4">Isaw</span>
        </div>

      </div>
    </div>
  );
}