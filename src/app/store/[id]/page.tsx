"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getStoreById, Store, trackEvent } from "@/lib/db";
// Use the new CRUD function for reviews to ensure compatibility
import { getReviewsByRestaurant } from "@/lib/firebase-reviews";
import { DishReview } from "@/lib/types";

import { Star, MapPin, Phone, Globe, Facebook, Instagram, ChevronLeft, ChevronRight, Plus, Minus, ShoppingCart, MessageCircle, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import DishReviewModal from "@/components/ui/DishReviewModal";

// --- HELPERS ---
const cleanPhoneNumber = (phone: string) => {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  // SG Specific Regex: Starts with 6, 8, or 9 and is 8 digits long
  if (cleaned.length === 8 && (cleaned.startsWith("8") || cleaned.startsWith("9") || cleaned.startsWith("6"))) {
    cleaned = "65" + cleaned;
  }
  return cleaned;
};

function HeroCarousel({ images, storeName }: { images: string[], storeName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);

  if (images.length === 0) {
    return (
      <div className="h-64 md:h-96 w-full bg-blue-900 flex items-center justify-center text-white text-3xl font-bold">
        {storeName}
      </div>
    );
  }

  return (
    <div className="h-64 md:h-96 w-full relative bg-black group overflow-hidden">
      {images.map((img, index) => (
        <div key={index} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-cover bg-center opacity-50 blur-xl" style={{ backgroundImage: `url(${img})` }} />
          <img src={img} className="absolute inset-0 w-full h-full object-contain z-10" alt={`Slide ${index}`} />
        </div>
      ))}
      {images.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-20 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={24} /></button>
          <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-20 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={24} /></button>
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none z-10"></div>
    </div>
  );
}

export default function StoreDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [reviews, setReviews] = useState<DishReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [allImages, setAllImages] = useState<string[]>([]);
  
  // States
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [reviewDish, setReviewDish] = useState<string | null>(null); // Acts as "isOpen" for the modal if not null

  useEffect(() => {
    if (typeof id === "string") {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (typeof id === "string") {
      const storeData = await getStoreById(id);
      setStore(storeData);
      
      if(storeData) {
        const imgs = [];
        if (storeData.imageUrl) imgs.push(storeData.imageUrl);
        if (storeData.foodImages) imgs.push(...storeData.foodImages);
        setAllImages(Array.from(new Set(imgs))); 
        
        // Fetch reviews using the new system
        const reviewsData = await getReviewsByRestaurant(storeData.id);
        setReviews(reviewsData);
      }
      setLoading(false);
    }
  };

  const updateCart = (itemName: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemName] || 0;
      const newCount = current + delta;
      if (newCount <= 0) {
        const { [itemName]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemName]: newCount };
    });
  };

  const getCartTotal = () => {
    if (!store?.menuItems) return 0;
    return Object.entries(cart).reduce((total, [name, qty]) => {
      const item = store.menuItems?.find(i => i.name === name);
      return total + (item ? item.price * qty : 0);
    }, 0);
  };

  const generateWhatsAppLink = () => {
    if (!store) return "#";
    let message = `Hi ${store.name}, I would like to order via Filipino Food Finder:\n\n`;
    const items = Object.entries(cart).map(([name, qty]) => {
      const item = store.menuItems?.find(i => i.name === name);
      const subtotal = item ? item.price * qty : 0;
      return `- ${qty}x ${name} ($${subtotal.toFixed(2)})`;
    });

    if (items.length > 0) {
      message += items.join("\n");
      message += `\n\n*Total: $${getCartTotal().toFixed(2)}*`;
    } else {
      message += "I have some questions about your menu.";
    }

    if (user && user.displayName) message += `\n\nName: ${user.displayName}`;
    
    const encoded = encodeURIComponent(message);
    const cleanNumber = cleanPhoneNumber(store.contactNumber);
    return `https://wa.me/${cleanNumber}?text=${encoded}`;
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="animate-pulse text-orange-600 font-bold">Loading...</div>
    </div>
  );

  if (!store) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-10 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
      <Link href="/" className="text-orange-600 hover:underline">Return Home</Link>
    </div>
  );

  if(user) trackEvent(user.uid, store.id, "view");
  const waLink = generateWhatsAppLink();

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      
      <div className="relative">
        <HeroCarousel images={allImages} storeName={store.name} />
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 z-20 text-white">
           <div className="max-w-7xl mx-auto">
             <h1 className="text-3xl md:text-5xl font-bold mb-2 drop-shadow-md">{store.name}</h1>
             <div className="flex flex-wrap gap-4 text-sm md:text-base drop-shadow-md font-medium">
                <span className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                  <Star className="fill-yellow-400 text-yellow-400" size={16}/> {store.rating?.toFixed(1) || "New"} ({reviews.length} reviews)
                </span>
                <span className="bg-black/30 px-2 py-1 rounded backdrop-blur-sm">{store.category}</span>
             </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="md:col-span-2 space-y-8">
           
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold mb-4 text-gray-900">About</h2>
             <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{store.description}</p>
             <div className="flex gap-4 mt-6">
                {store.facebookUrl && <Link href={store.facebookUrl} target="_blank" className="p-3 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"><Facebook size={20}/></Link>}
                {store.instagramUrl && <Link href={store.instagramUrl} target="_blank" className="p-3 bg-pink-50 text-pink-700 rounded-full hover:bg-pink-100 transition-colors"><Instagram size={20}/></Link>}
                {store.websiteUrl && <Link href={store.websiteUrl} target="_blank" className="p-3 bg-gray-50 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"><Globe size={20}/></Link>}
             </div>
           </div>

           {allImages.length > 0 && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Gallery</h2>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {allImages.map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                      <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                    </div>
                  ))}
                </div>
             </div>
           )}

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold mb-6 text-gray-900">Menu</h2>
             
             {store.menuItems && store.menuItems.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {store.menuItems.map((item, idx) => (
                   <div key={idx} className={`flex gap-3 border p-3 rounded-lg bg-white ${item.isAvailable === false ? 'opacity-60 bg-gray-50' : 'hover:shadow-md transition-shadow'}`}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} className="w-24 h-24 rounded-md object-cover bg-gray-100 border flex-shrink-0" />
                      ) : (
                        <div className="w-24 h-24 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">No Img</div>
                      )}
                      <div className="flex flex-col justify-between flex-grow">
                        <div>
                          <div className="flex justify-between items-start">
                             <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{item.name}</h3>
                             {item.avgRating ? (
                               <div className="flex items-center gap-0.5 text-xs text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded ml-2">
                                 <Star size={10} fill="currentColor"/> {item.avgRating.toFixed(1)}
                               </div>
                             ) : null}
                          </div>
                          <p className="text-orange-600 font-bold mt-1 text-sm">${item.price.toFixed(2)}</p>
                          {item.isAvailable === false && <span className="text-red-600 font-bold text-[10px] uppercase bg-red-100 px-1 rounded inline-block mt-1">Sold Out</span>}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                           {/* REVIEW BUTTON */}
                           <button 
                              onClick={() => setReviewDish(item.name)} 
                              className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold bg-blue-50 px-2 py-1 rounded-full transition-colors"
                           >
                             <MessageCircle size={12}/> Rate Dish
                           </button>

                           {/* CART CONTROLS */}
                           {item.isAvailable !== false && (
                              <div className="flex items-center gap-2">
                                 <button onClick={() => updateCart(item.name, -1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600" disabled={!cart[item.name]}><Minus size={14}/></button>
                                 <span className="font-bold w-4 text-center text-sm">{cart[item.name] || 0}</span>
                                 <button onClick={() => updateCart(item.name, 1)} className="p-1 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200"><Plus size={14}/></button>
                              </div>
                           )}
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-gray-500 italic text-center py-4">No menu items listed yet.</p>
             )}
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Reviews ({reviews.length})</h2>
                {user && (
                  <button 
                    onClick={() => setReviewDish("")} 
                    className="text-sm font-bold text-orange-600 hover:underline"
                  >
                    Write a Review
                  </button>
                )}
             </div>
             
             <div className="space-y-6">
                {reviews.map(r => (
                  <div key={r.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                             {r.userPhoto ? (
                               <img src={r.userPhoto} alt={r.userName} className="w-full h-full object-cover"/>
                             ) : (
                               <UserIcon className="w-5 h-5 text-gray-400"/>
                             )}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-gray-900 block">{r.userName || "Anonymous"}</span>
                            <span className="text-xs text-gray-400 block">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}</span>
                          </div>
                       </div>
                       
                       <div className="text-right">
                          <div className="flex items-center justify-end gap-1 text-yellow-400 mb-1">
                             <Star size={14} fill="currentColor"/>
                             <span className="text-gray-900 font-bold text-sm">{r.rating}</span>
                          </div>
                          {r.dishName && (
                            <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                              {r.dishName}
                            </span>
                          )}
                       </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mt-2">{r.comment}</p>
                  </div>
                ))}
                
                {reviews.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm italic">No reviews yet.</p>
                  </div>
                )}
             </div>
           </div>
        </div>

        {/* RIGHT COLUMN (Sticky Info) */}
        <div className="hidden md:block space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24 border border-gray-200 z-30">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900"><ShoppingCart size={20}/> Your Order</h3>
              
              {Object.keys(cart).length > 0 ? (
                <div className="space-y-2 mb-4 text-sm">
                  {Object.entries(cart).map(([name, qty]) => (
                    <div key={name} className="flex justify-between border-b border-dashed border-gray-100 pb-2 mb-2 last:border-0">
                      <span className="text-gray-700">{qty}x {name}</span>
                      <span className="font-bold text-gray-900">${((store.menuItems?.find(i=>i.name===name)?.price || 0) * qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-4 flex justify-between font-bold text-lg text-gray-900">
                    <span>Total</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              ) : <p className="text-gray-500 text-sm mb-4 text-center py-4 bg-gray-50 rounded-lg">Select items to start your order.</p>}

              <a 
                href={waLink} 
                target="_blank"
                onClick={() => user && trackEvent(user.uid, store.id, "whatsapp_click")}
                className="block w-full bg-green-600 text-white text-center py-4 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-transform hover:scale-[1.02]"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6 invert brightness-0" />
                {Object.keys(cart).length > 0 ? "Send Order" : "Chat via WhatsApp"}
              </a>

              <div className="space-y-5 text-sm text-gray-700 mt-6 border-t pt-6">
                 {/* ADDRESS LINKED TO GOOGLE MAPS */}
                 <div className="flex items-start gap-3">
                    <MapPin className="text-orange-500 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <span className="font-bold block text-gray-900 mb-1">Address</span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`} 
                        target="_blank" 
                        className="text-blue-600 hover:underline leading-relaxed block"
                      >
                        {store.address}
                      </a>
                    </div>
                 </div>
                 
                 {store.nearestMrt && (
                   <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 leading-none">🚇</span>
                      <div>
                        <span className="font-bold block text-gray-900 mb-1">Nearest MRT</span>
                        <span>{store.walkingTime ? `${store.walkingTime} from ` : ""}{store.nearestMrt}</span>
                      </div>
                   </div>
                 )}
                 
                 <div className="flex items-start gap-3">
                    <Phone className="text-orange-500 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <span className="font-bold block text-gray-900 mb-1">Contact</span>
                      <a href={`tel:${cleanPhoneNumber(store.contactNumber)}`} className="hover:text-orange-600">
                        {store.contactNumber}
                      </a>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* MOBILE STICKY BOTTOM BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center safe-area-bottom">
           <div>
             <p className="text-xs text-gray-500">Total Order</p>
             <p className="text-xl font-bold text-gray-900">${getCartTotal().toFixed(2)}</p>
           </div>
           <a 
              href={waLink} 
              target="_blank"
              onClick={() => user && trackEvent(user.uid, store.id, "whatsapp_click")}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-transform"
           >
             <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-5 h-5 invert brightness-0" />
             {Object.keys(cart).length > 0 ? "Place Order" : "Chat"}
           </a>
        </div>

      </div>

      {/* Dish Review Modal */}
      {/* LOGIC: 
        1. isOpen: true if reviewDish (string) is not null.
        2. restaurantId: store.id
        3. defaultDishName: the value of reviewDish (e.g. "Chicken Adobo")
      */}
      {store && (
        <DishReviewModal 
          isOpen={!!reviewDish} 
          onClose={() => setReviewDish(null)}
          restaurantId={store.id} 
          currentUser={user}
          defaultDishName={reviewDish || ""}
          onReviewSuccess={fetchData}
        />
      )}
    </div>
  );
}