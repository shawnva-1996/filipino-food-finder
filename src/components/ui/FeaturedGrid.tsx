// src/components/ui/FeaturedGrid.tsx
import { Star } from 'lucide-react';

// Temporary Mock Data (We will replace this with Firebase data later)
const FEATURED_ITEMS = [
  {
    id: 1,
    name: "Cebu Lechon",
    store: "Lechon Republic",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1626202158525-47eb7cb70498?w=800&auto=format&fit=crop",
    tags: ["Roasted", "Pork"],
  },
  {
    id: 2,
    name: "Chicken Adobo",
    store: "Kabayan Home Kitchen",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop",
    tags: ["Classic", "Home-based"],
  },
  {
    id: 3,
    name: "Halo-Halo Special",
    store: "Tita's Desserts",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1563630656094-1a3ebc757c4c?w=800&auto=format&fit=crop",
    tags: ["Dessert", "Cold"],
  },
];

export default function FeaturedGrid() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Featured Cravings</h2>
          <p className="mt-2 text-gray-600">Top rated dishes by the community this week.</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURED_ITEMS.map((item) => (
            <div key={item.id} className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
              
              {/* Image */}
              <div className="h-48 overflow-hidden bg-gray-200 relative">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg shadow text-xs font-bold flex items-center gap-1">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  {item.rating}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{item.name}</h3>
                <p className="text-gray-500 text-sm mb-3">by {item.store}</p>
                <div className="flex gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-md font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}