// src/components/map/MapComponent.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { getStores, Store, trackEvent, toggleFavorite } from "@/lib/db";
import { useSearchParams, useRouter } from "next/navigation";
import { Navigation, Star, Heart, ExternalLink, Search, List, Map as MapIcon, Clock, MapPin } from "lucide-react";
import ReviewModal from "@/components/ui/ReviewModal";
import ReviewsListModal from "@/components/ui/ReviewsListModal";
import { useAuth } from "@/context/AuthContext";

// Helper to ensure links work
const ensureUrl = (url?: string) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
};

// Helper for "From $X"
const getLowestPrice = (store: Store) => {
  if (!store.menuItems || store.menuItems.length === 0) return null;
  const min = Math.min(...store.menuItems.map(i => i.price));
  return min.toFixed(2);
};

// Helper for Time Ago
const getTimeAgo = (timestamp: any) => {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  return "Just now";
};

// Auto-Swipe Carousel Component (No Crop)
function StoreCardCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000); 
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-100">
      {images.map((img, i) => (
        <img 
          key={i} 
          src={img} 
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`} 
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-2 right-2 flex gap-1 z-10">
          {images.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-black' : 'bg-gray-400'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function MapUpdater({ center, zoom }: { center: { lat: number, lng: number }, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
}

export default function MapComponent() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  
  // Data
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  
  // View & Map State
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [center, setCenter] = useState({ lat: 1.3521, lng: 103.8198 });
  const [zoom, setZoom] = useState(11);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Modals
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [showReadReviews, setShowReadReviews] = useState(false);
  
  // Filter States
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState({
    region: "All",
    price: "All",
    category: "All"
  });

  useEffect(() => {
    getStores().then(setAllStores);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
      });
    }
  }, []);

  const filteredStores = useMemo(() => {
    return allStores.filter(store => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === "" || 
        store.name.toLowerCase().includes(term) ||
        store.description.toLowerCase().includes(term) ||
        store.address.toLowerCase().includes(term) ||
        (store.nearestMrt && store.nearestMrt.toLowerCase().includes(term)) ||
        store.keywords?.some(k => k.toLowerCase().includes(term));

      const matchesRegion = filters.region === "All" || store.region === filters.region;
      const matchesCategory = filters.category === "All" || store.category === filters.category;
      
      let matchesPrice = true;
      if (filters.price !== "All") {
         if (store.priceRange) matchesPrice = store.priceRange === filters.price;
         const min = getLowestPrice(store);
         if (min) {
            const p = parseFloat(min);
            if (filters.price === "$") matchesPrice = p < 10;
            if (filters.price === "$$") matchesPrice = p >= 10 && p < 20;
            if (filters.price === "$$$") matchesPrice = p >= 20;
         }
      }

      return matchesSearch && matchesRegion && matchesPrice && matchesCategory;
    });
  }, [allStores, searchTerm, filters]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setCenter(loc);
        setZoom(15);
        setViewMode("map");
      }, (err) => alert("Could not get location"));
    }
  };

  const navigateToStore = (id: string) => {
    router.push(`/store/${id}`);
  };

  const renderStoreCard = (store: Store) => {
    const minPrice = getLowestPrice(store);
    const lastUpdated = getTimeAgo(store.lastUpdated);
    const images = store.foodImages && store.foodImages.length > 0 ? store.foodImages : (store.imageUrl ? [store.imageUrl] : []);

    return (
      <div 
        key={store.id} 
        onClick={() => navigateToStore(store.id)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col sm:flex-row h-auto min-h-[220px] cursor-pointer"
      >
        {/* Carousel Side */}
        <div className="w-full sm:w-64 h-64 sm:h-full bg-gray-100 flex-shrink-0 relative">
          {images.length > 0 ? <StoreCardCarousel images={images} /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">No Image</div>}
          
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1 z-10">
             <Star size={12} className="fill-yellow-400 text-yellow-400"/> {store.rating?.toFixed(1) || "New"}
          </div>
        </div>

        {/* Content Side */}
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
               <div>
                 <h3 className="font-bold text-xl text-blue-900 leading-tight hover:underline">{store.name}</h3>
                 <span className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                   <MapPin size={14}/> {store.address}
                 </span>
               </div>
               <button onClick={(e) => {
                   e.stopPropagation();
                   if(!user) return alert("Login required");
                   const isFav = profile?.favorites?.includes(store.id) || false;
                   toggleFavorite(user.uid, store.id, isFav);
                   refreshProfile();
                 }} className="text-red-500 hover:bg-red-50 p-1 rounded-full z-10">
                 <Heart size={20} fill={profile?.favorites?.includes(store.id) ? "currentColor" : "none"} />
               </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
               {store.nearestMrt && (
                 <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs flex items-center gap-1 font-medium">
                   🚇 {store.walkingTime ? `${store.walkingTime} from ` : ""}{store.nearestMrt}
                 </span>
               )}
               {minPrice && (
                 <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold">
                   From ${minPrice}
                 </span>
               )}
               <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{store.category}</span>
            </div>

            <p className="text-sm text-gray-700 mt-3 line-clamp-2">"{store.description}"</p>
          </div>

          <div className="flex justify-between items-end mt-4 border-t pt-3">
             <div className="text-[10px] text-gray-400 flex items-center gap-1">
               <Clock size={10} /> Updated {lastUpdated}
             </div>
             
             <div className="flex gap-2">
               <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2">
                 View Menu & Order
               </button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col relative bg-gray-50">
      
      {/* --- TOP CONTROL BAR --- */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center">
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search store, cuisine, or MRT..." 
              className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-1 md:pb-0">
             <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={filters.region} onChange={e=>setFilters({...filters, region: e.target.value})}>
                <option value="All">All Regions</option>
                <option value="General">General</option><option value="Kapampangan">Kapampangan</option><option value="Ilocano">Ilocano</option><option value="Bisaya">Bisaya</option><option value="Bicolano">Bicolano</option><option value="Tagalog">Tagalog</option>
             </select>
             <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={filters.price} onChange={e=>setFilters({...filters, price: e.target.value})}>
                <option value="All">All Prices</option><option value="$">Budget</option><option value="$$">Mid</option><option value="$$$">High</option>
             </select>
             
             <div className="flex bg-gray-100 p-1 rounded-lg border ml-auto">
               <button onClick={() => setViewMode("map")} className={`p-2 rounded-md transition-colors ${viewMode === "map" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}><MapIcon size={20} /></button>
               <button onClick={() => setViewMode("list")} className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}><List size={20} /></button>
             </div>
          </div>
        </div>
      </div>

      {/* --- VIEW MODE --- */}
      <div className="flex-grow relative overflow-hidden">
        {viewMode === "map" ? (
          <div className="w-full h-full">
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}>
              <Map defaultCenter={center} defaultZoom={zoom} mapId="DEMO_MAP_ID" gestureHandling={'greedy'} disableDefaultUI={false} className="w-full h-full">
                <MapUpdater center={center} zoom={zoom} />
                {userLocation && <AdvancedMarker position={userLocation}><div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" /></AdvancedMarker>}

                {filteredStores.map((store) => (
                  <AdvancedMarker key={store.id} position={{ lat: store.lat, lng: store.lng }} onClick={() => setSelectedStore(store)}>
                    <div className="relative group cursor-pointer hover:z-50 hover:scale-110 transition-transform">
                       <div className="bg-white rounded-lg shadow-md flex flex-col items-center p-1 border border-gray-300 min-w-[100px] max-w-[120px]">
                          {store.imageUrl ? (
                            <img src={store.imageUrl} className="w-full h-12 object-cover rounded-t mb-1" />
                          ) : (
                            <div className="w-full h-8 bg-red-100 flex items-center justify-center text-red-600 font-bold rounded-t text-xs">No Img</div>
                          )}
                          <span className="text-[10px] font-bold text-center leading-tight px-1 w-full truncate">{store.name}</span>
                          
                          {/* KEYWORDS */}
                          {store.keywords && store.keywords[0] && (
                             <span className="text-[9px] text-gray-500 truncate w-full text-center">{store.keywords[0]}</span>
                          )}

                          <div className="flex justify-between items-center w-full px-1 mt-1 border-t pt-1">
                             <div className="flex items-center gap-0.5">
                               <Star size={8} className="fill-yellow-400 text-yellow-400" />
                               <span className="text-[9px] font-bold">{store.rating?.toFixed(1) || "New"}</span>
                             </div>
                             <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-3 h-3" />
                          </div>
                       </div>
                       <div className="w-2 h-2 bg-white rotate-45 border-r border-b border-gray-300 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                  </AdvancedMarker>
                ))}

                {selectedStore && (
                  <InfoWindow 
                    position={{ lat: selectedStore.lat, lng: selectedStore.lng }} 
                    onCloseClick={() => setSelectedStore(null)} 
                    headerContent={<div className="font-bold">{selectedStore.name}</div>}
                  >
                    {/* ENTIRE INFO WINDOW CLICKABLE TO NAVIGATE */}
                    <div 
                      className="p-2 min-w-[240px] max-w-[260px] cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => navigateToStore(selectedStore.id)}
                    >
                      {selectedStore.imageUrl && <img src={selectedStore.imageUrl} className="w-full h-24 object-cover rounded mb-2" />}
                      
                      <div className="flex gap-2 mb-2 flex-wrap" onClick={e => e.stopPropagation()}>
                         {selectedStore.facebookUrl && <a href={ensureUrl(selectedStore.facebookUrl)} target="_blank" className="text-blue-600 text-xs hover:underline">Facebook</a>}
                         {selectedStore.instagramUrl && <a href={ensureUrl(selectedStore.instagramUrl)} target="_blank" className="text-pink-600 text-xs hover:underline">Instagram</a>}
                      </div>

                      {/* MRT Info */}
                      {selectedStore.nearestMrt && (
                        <p className="text-xs font-bold text-purple-700 mb-2">🚇 {selectedStore.walkingTime ? selectedStore.walkingTime + " from " : ""}{selectedStore.nearestMrt}</p>
                      )}

                      <div className="flex justify-between items-center mb-3">
                         <button onClick={async (e) => {
                             e.stopPropagation(); // Don't navigate
                             if(!user) return alert("Login required");
                             const isFav = profile?.favorites?.includes(selectedStore.id) || false;
                             await toggleFavorite(user.uid, selectedStore.id, isFav);
                             await refreshProfile();
                           }} className="flex items-center gap-1 text-xs text-red-500 font-bold hover:bg-red-50 p-1 rounded">
                           <Heart size={16} fill={profile?.favorites?.includes(selectedStore.id) ? "currentColor" : "none"} />
                           {profile?.favorites?.includes(selectedStore.id) ? "Saved" : "Save"}
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); setShowReadReviews(true); }} className="text-blue-600 text-xs hover:underline">
                           Reviews ({selectedStore.reviewsCount || 0})
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); setShowWriteReview(true); }} className="text-xs border px-2 py-1 rounded hover:bg-gray-50">Rate</button>
                      </div>
                      
                      <div className="mt-2 text-center text-blue-600 text-sm font-bold underline">
                        View Menu & Details →
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
            
            <button onClick={handleLocateMe} className="absolute bottom-8 right-4 bg-white p-3 rounded-full shadow-lg text-blue-600 hover:bg-gray-50 z-10" title="Locate Me">
              <Navigation size={20} />
            </button>
          </div>
        ) : (
          // --- LIST VIEW ---
          <div className="w-full h-full overflow-y-auto p-4">
             <div className="max-w-4xl mx-auto grid gap-4 pb-20">
               {filteredStores.length > 0 ? (
                 filteredStores.map(store => renderStoreCard(store))
               ) : (
                 <div className="text-center py-20 text-gray-500">No stores found matching your filters.</div>
               )}
             </div>
          </div>
        )}
      </div>

      {showWriteReview && selectedStore && <ReviewModal storeId={selectedStore.id} onClose={() => setShowWriteReview(false)} />}
      {showReadReviews && selectedStore && <ReviewsListModal storeId={selectedStore.id} onClose={() => setShowReadReviews(false)} />}
    </div>
  );
}