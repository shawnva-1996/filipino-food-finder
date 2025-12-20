import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  addDoc,
  query, 
  where,
  orderBy,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- TYPES ---

export interface MenuItem {
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  // Stats for sorting top dishes (calculated via aggregation)
  avgRating?: number;
  reviewCount?: number;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  category: string;
  description: string;
  // Location
  lat: number;
  lng: number;
  region?: string;
  nearestMrt?: string;
  walkingTime?: string;
  
  // Stats
  rating: number; // General Store Rating
  ratingTotal?: number;
  manualRating?: number;
  reviewsCount: number;
  views?: number;
  whatsappClicks?: number;
  
  // Business Info
  contactNumber: string;
  status: string; // 'approved' | 'pending'
  ownerId: string;
  ownerEmail: string;
  priceRange?: string;
  isHalal?: boolean;
  keywords?: string[];
  isFeatured?: boolean;
  lastUpdated?: Timestamp;

  // Media
  imageUrl?: string; // Main Cover
  foodImages?: string[]; // Gallery
  
  // Menu
  menuItems?: MenuItem[];
  menuUrl?: string; // Link to external menu
  menuText?: string; // Text version of menu

  // Social Links
  websiteUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  favorites?: string[]; // Array of Store IDs
  role: "user" | "business" | "admin";
  emailVerified?: boolean;
  photoURL?: string;
}

// --- CORE STORE FUNCTIONS ---

export const getStores = async (searchTerm: string = "") => {
  try {
    const storesRef = collection(db, "stores");
    const q = query(storesRef); // Fetch all, then filter client-side for flexibility
    const snapshot = await getDocs(q);
    
    const allStores = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Store[];

    // 1. Filter by Status 'approved'
    let filtered = allStores.filter(store => store.status === 'approved');

    // 2. Client-side Search Filtering
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(lowerTerm) ||
        store.description?.toLowerCase().includes(lowerTerm) ||
        store.address.toLowerCase().includes(lowerTerm) ||
        store.nearestMrt?.toLowerCase().includes(lowerTerm) ||
        store.keywords?.some(k => k.toLowerCase().includes(lowerTerm)) ||
        store.menuItems?.some(m => m.name.toLowerCase().includes(lowerTerm))
      );
    }
    return filtered;
  } catch (error) {
    console.error("Error getting stores:", error);
    return [];
  }
};

export const getStoreById = async (id: string) => {
  try {
    const docRef = doc(db, "stores", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } as Store : null;
  } catch (error) {
    console.error("Error getting store by ID:", error);
    return null;
  }
};

// --- REVIEWS & DISHES ---

// Fetch Top Dishes across ALL stores based on menu item ratings
export const getTopDishes = async (limitCount = 6) => {
  try {
    // 1. Fetch all stores
    const storesRef = collection(db, "stores");
    const snapshot = await getDocs(storesRef);
    
    let allDishes: any[] = [];

    // 2. Extract Menu Items from each store
    snapshot.docs.forEach(doc => {
      const store = doc.data() as Store;
      if (store.status === 'approved' && store.menuItems && Array.isArray(store.menuItems)) {
        store.menuItems.forEach((item: MenuItem) => {
          // Only include dishes that have at least one rating
          if (item.avgRating && item.avgRating > 0) {
            allDishes.push({
              ...item,
              storeId: doc.id,
              storeName: store.name,
              storeAddress: store.address || "",
              // Fallback to store image if dish has no image
              imageUrl: item.imageUrl || store.imageUrl 
            });
          }
        });
      }
    });

    // 3. Sort by Rating (Desc), then by Review Count (Desc)
    allDishes.sort((a, b) => {
      if (b.avgRating !== a.avgRating) return (b.avgRating || 0) - (a.avgRating || 0);
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });

    // 4. Return top X
    return allDishes.slice(0, limitCount);
  } catch (error) {
    console.error("Error getting top dishes:", error);
    return [];
  }
};

// Used for Legacy/General Store Reviews (Sub-collection)
export const getStoreReviews = async (storeId: string) => {
  try {
    const q = query(
      collection(db, "stores", storeId, "reviews"), 
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting store reviews:", error);
    return [];
  }
};

// --- USER & PROFILE FUNCTIONS ---

export const getUserProfile = async (uid: string) => {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    const ref = doc(db, "users", uid);
    await setDoc(ref, data, { merge: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const toggleFavorite = async (uid: string, storeId: string, isFavorite: boolean) => {
  try {
    const ref = doc(db, "users", uid);
    if (isFavorite) {
      await updateDoc(ref, { favorites: arrayRemove(storeId) });
    } else {
      await updateDoc(ref, { favorites: arrayUnion(storeId) });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};

// --- ANALYTICS ---

export const trackEvent = async (userId: string, storeId: string, type: "view" | "whatsapp_click") => {
  try {
    // 1. Log the event
    await addDoc(collection(db, "events"), {
      userId,
      storeId,
      type,
      timestamp: serverTimestamp()
    });

    // 2. Increment counters on the Store document
    const storeRef = doc(db, "stores", storeId);
    if (type === "view") {
      await updateDoc(storeRef, { views: increment(1) });
    } else if (type === "whatsapp_click") {
      await updateDoc(storeRef, { whatsappClicks: increment(1) });
    }
  } catch (error) {
    console.error("Error tracking event:", error);
  }
};