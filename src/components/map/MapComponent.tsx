// src/components/map/MapComponent.tsx
"use client";

import { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { getStores, Store, trackEvent, toggleFavorite } from "@/lib/db";
import { useSearchParams } from "next/navigation";
import { Navigation, Star, Heart, ExternalLink } from "lucide-react";
import ReviewModal from "@/components/ui/ReviewModal";
import ReviewsListModal from "@/components/ui/ReviewsListModal";
import { useAuth } from "@/context/AuthContext";

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
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  
  // Geolocation State
  const [center, setCenter] = useState({ lat: 1.3521, lng: 103.8198 });
  const [zoom, setZoom] = useState(11);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const [showWriteReview, setShowWriteReview] = useState(false);
  const [showReadReviews, setShowReadReviews] = useState(false);
  
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  // Initial Data Load
  useEffect(() => {
    getStores(query).then(setStores);
  }, [query]);

  // Initial Geolocation (Auto-run once)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          // Optional: Auto-center on load. Remove if annoying.
          // setCenter(loc); 
          // setZoom(14);
      });
    }
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setCenter(loc);
        setZoom(15);
      }, (err) => alert("Could not get location"));
    } else {
      alert("Geolocation not supported");
    }
  };

  return (
    <div className="h-[80vh] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}>
        <Map defaultCenter={center} defaultZoom={zoom} mapId="DEMO_MAP_ID" gestureHandling={'greedy'} disableDefaultUI={false} className="w-full h-full">
          <MapUpdater center={center} zoom={zoom} />
          
          {userLocation && (
            <AdvancedMarker position={userLocation}>
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </AdvancedMarker>
          )}

          {stores.map((store) => (
            <AdvancedMarker key={store.id} position={{ lat: store.lat, lng: store.lng }} onClick={() => { setSelectedStore(store); if(user) trackEvent(user.uid, store.id, "view"); }}>
              <div className="relative group cursor-pointer hover:z-50 hover:scale-110 transition-transform">
                 <div className="bg-white rounded-lg shadow-md flex flex-col items-center p-1 border border-gray-300 min-w-[100px] max-w-[120px]">
                    {/* Rich Pin Content */}
                    {store.imageUrl ? (
                      <img src={store.imageUrl} className="w-full h-12 object-cover rounded-t mb-1" />
                    ) : (
                      <div className="w-full h-8 bg-red-100 flex items-center justify-center text-red-600 font-bold rounded-t text-xs">No Img</div>
                    )}
                    
                    <span className="text-[10px] font-bold text-center leading-tight px-1 w-full truncate">{store.name}</span>
                    
                    {store.keywords && store.keywords[0] && (
                       <span className="text-[9px] text-gray-500 truncate w-full text-center">{store.keywords[0]}</span>
                    )}

                    <div className="flex justify-between items-center w-full px-1 mt-1 border-t pt-1">
                       <div className="flex items-center gap-0.5">
                         <Star size={8} className="fill-yellow-400 text-yellow-400" />
                         <span className="text-[9px] font-bold">{store.rating?.toFixed(1) || "New"}</span>
                       </div>
                       {/* WhatsApp Indicator Icon on Pin */}
                       <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-3 h-3" />
                    </div>
                 </div>
                 <div className="w-2 h-2 bg-white rotate-45 border-r border-b border-gray-300 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
              </div>
            </AdvancedMarker>
          ))}

          {selectedStore && (
            <InfoWindow position={{ lat: selectedStore.lat, lng: selectedStore.lng }} onCloseClick={() => setSelectedStore(null)} headerContent={<div className="font-bold">{selectedStore.name}</div>}>
              <div className="p-2 min-w-[240px] max-w-[260px]">
                {selectedStore.imageUrl && <img src={selectedStore.imageUrl} className="w-full h-24 object-cover rounded mb-2" />}
                
                <div className="flex gap-2 mb-2 flex-wrap">
                   {selectedStore.facebookUrl && <a href={selectedStore.facebookUrl} target="_blank" className="text-blue-600 text-xs hover:underline">Facebook</a>}
                   {selectedStore.instagramUrl && <a href={selectedStore.instagramUrl} target="_blank" className="text-pink-600 text-xs hover:underline">Instagram</a>}
                   {selectedStore.websiteUrl && <a href={selectedStore.websiteUrl} target="_blank" className="text-gray-600 text-xs hover:underline"><ExternalLink size={12} className="inline"/> Web</a>}
                </div>

                {selectedStore.menuUrl ? (
                  <a href={selectedStore.menuUrl} target="_blank" className="block mb-2 text-xs text-blue-600 underline">View Menu Image</a>
                ) : (
                  selectedStore.menuText && <div className="bg-gray-50 p-2 text-xs mb-2 rounded border max-h-20 overflow-y-auto whitespace-pre-wrap">{selectedStore.menuText}</div>
                )}
                
                <div className="flex justify-between items-center mb-3">
                   <button onClick={async () => {
                       if(!user) return alert("Login required");
                       const isFav = profile?.favorites?.includes(selectedStore.id) || false;
                       await toggleFavorite(user.uid, selectedStore.id, isFav);
                       await refreshProfile();
                     }} className="flex items-center gap-1 text-xs text-red-500 font-bold hover:bg-red-50 p-1 rounded">
                     <Heart size={16} fill={profile?.favorites?.includes(selectedStore.id) ? "currentColor" : "none"} />
                     {profile?.favorites?.includes(selectedStore.id) ? "Saved" : "Save"}
                   </button>
                   <button onClick={() => setShowReadReviews(true)} className="text-blue-600 text-xs hover:underline">
                     Reviews ({selectedStore.reviewsCount || 0})
                   </button>
                   <button onClick={() => setShowWriteReview(true)} className="text-xs border px-2 py-1 rounded hover:bg-gray-50">Rate</button>
                </div>
                
                <a href={`https://wa.me/${selectedStore.contactNumber}`} target="_blank" onClick={() => user && trackEvent(user.uid, selectedStore.id, "whatsapp_click")} className="block w-full text-center bg-green-600 text-white text-xs py-2 rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4 invert brightness-0" /> WhatsApp Order
                </a>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
      
      <button onClick={handleLocateMe} className="absolute bottom-8 right-4 bg-white p-3 rounded-full shadow-lg text-blue-600 hover:bg-gray-50 z-10" title="Locate Me">
        <Navigation size={20} />
      </button>

      {showWriteReview && selectedStore && <ReviewModal storeId={selectedStore.id} onClose={() => setShowWriteReview(false)} />}
      {showReadReviews && selectedStore && <ReviewsListModal storeId={selectedStore.id} onClose={() => setShowReadReviews(false)} />}
    </div>
  );
}