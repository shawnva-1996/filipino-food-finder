"use client";

import Link from 'next/link';
import { Search, Star, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTopDishes } from '@/lib/db';
import Image from 'next/image';

export default function FeaturedGrid() {
  const router = useRouter();
  const [topDishes, setTopDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const data = await getTopDishes(6);
        setTopDishes(data);
      } catch (error) {
        console.error("Failed to load top dishes", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading top dishes...</div>;

  // Don't render section if no rated dishes exist
  if (topDishes.length === 0) return null;

  return (
    <div className="relative bg-white overflow-hidden pb-12">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        
        <div className="w-full max-w-6xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-2">
            <Star className="fill-orange-400 text-orange-400 w-6 h-6" /> 
            Top Rated Dishes
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
            {topDishes.map((dish, idx) => (
              <Link 
                href={`/store/${dish.storeId}`} 
                key={idx} 
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 flex gap-4 group h-full"
              >
                {/* Dish Image */}
                <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {dish.imageUrl ? (
                    <Image 
                      src={dish.imageUrl} 
                      alt={dish.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No Img
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center min-w-0">
                  <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1 truncate">
                    {dish.name}
                  </h4>
                  <p className="text-sm text-orange-600 font-medium mb-1 truncate">
                    {dish.storeName}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2 truncate">
                    <MapPin size={12} className="flex-shrink-0" /> 
                    <span className="truncate">{dish.storeAddress?.split(",")[0]}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-md self-start border border-yellow-100">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" /> 
                    <span className="font-bold text-yellow-700 text-xs">{dish.avgRating?.toFixed(1)}</span>
                    <span className="text-gray-400 text-xs ml-0.5">({dish.reviewCount})</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}