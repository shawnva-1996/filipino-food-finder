// src/components/ui/FeaturedGrid.tsx
"use client";

import Link from 'next/link';
import { Search, Star, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTopDishes } from '@/lib/db';

export default function Hero() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [topDishes, setTopDishes] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Top Rated Menu Items
    getTopDishes(6).then(setTopDishes);
  }, []);

  const handleSearch = () => {
    if (search.trim()) router.push(`/map?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="relative bg-white overflow-hidden pb-12">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* TOP RATED DISHES */}
        {topDishes.length > 0 && (
          <div className="w-full max-w-6xl">
            <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center justify-center gap-2">
              <Star className="fill-yellow-400 text-yellow-400" /> Top Rated Dishes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
              {topDishes.map((dish, idx) => (
                <Link href={`/store/${dish.storeId}`} key={idx} className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 flex gap-4 group">
                  {dish.imageUrl ? (
                    <img src={dish.imageUrl} className="w-24 h-24 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 flex-shrink-0">No Img</div>
                  )}
                  <div className="flex flex-col justify-center">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{dish.name}</h4>
                    <p className="text-sm text-blue-600 font-medium mb-1">{dish.storeName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <MapPin size={12} /> {dish.storeAddress.split(",")[0]}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600 font-bold text-sm">
                      <Star size={12} fill="currentColor" /> {dish.avgRating?.toFixed(1)} <span className="text-gray-400 font-normal">({dish.reviewCount})</span>
                    </div>
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