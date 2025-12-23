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
  Timestamp,
  limit
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

export interface DishReview {
  id?: string;
  storeId: string;
  storeName: string;
  dishName: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  createdAt: any;
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

// ** UPDATED: Supports slug/name lookup **
export const getStoreById = async (idOrName: string) => {
  try {
    // 1. Try fetching by Document ID first (Direct lookup is fastest)
    const docRef = doc(db, "stores", idOrName);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Store;
    }

    // 2. If not found by ID, try finding by Name (Slug logic)
    // URL Slug "Good-Bites" -> DB Name "Good Bites"
    const decodedName = decodeURIComponent(idOrName);
    const nameWithSpaces = idOrName.replace(/-/g, " "); // Basic slug reversal
    
    const storesRef = collection(db, "stores");
    // Query matches either raw decoded or space-replaced version
    const q = query(storesRef, where("name", "in", [decodedName, nameWithSpaces]), limit(1));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const doc = querySnap.docs[0];
      return { id: doc.id, ...doc.data() } as Store;
    }

    return null;
  } catch (error) {
    console.error("Error getting store by ID/Slug:", error);
    return null;
  }
};

// --- REVIEWS & DISHES ---

export const getTopDishes = async (limitCount = 6) => {
  try {
    const storesRef = collection(db, "stores");
    const snapshot = await getDocs(storesRef);
    
    let allDishes: any[] = [];

    snapshot.docs.forEach(doc => {
      const store = doc.data() as Store;
      // Ensure we only show dishes from approved stores
      if (store.status === 'approved' && store.menuItems && Array.isArray(store.menuItems)) {
        store.menuItems.forEach((item: MenuItem) => {
          // Only include dishes that have at least one rating
          if (item.avgRating && item.avgRating > 0) {
            // Create a safe slug for the URL
            const slug = store.name.replace(/\s+/g, '-');
            
            allDishes.push({
              ...item,
              storeId: slug, // ** Use Slug for URL linking **
              realStoreId: doc.id, 
              storeName: store.name,
              storeAddress: store.address || "",
              imageUrl: item.imageUrl || store.imageUrl 
            });
          }
        });
      }
    });

    // Sort Descending by Rating, then Review Count
    allDishes.sort((a, b) => {
      if (b.avgRating !== a.avgRating) return (b.avgRating || 0) - (a.avgRating || 0);
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });

    return allDishes.slice(0, limitCount);
  } catch (error) {
    console.error("Error getting top dishes:", error);
    return [];
  }
};

// ** LEGACY: Fetch Store Reviews from Subcollection **
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

// ** LEGACY: Fetch Dish Reviews from Subcollection **
// (Retained for backward compatibility if you have old data here)
export const getDishReviews = async (storeId: string, dishName?: string) => {
  try {
    let q = query(collection(db, "stores", storeId, "dish_reviews"), orderBy("createdAt", "desc"));
    if (dishName) {
      q = query(collection(db, "stores", storeId, "dish_reviews"), where("dishName", "==", dishName), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as DishReview[];
  } catch (error) {
    console.error("Error getting legacy dish reviews:", error);
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
    await addDoc(collection(db, "events"), {
      userId,
      storeId,
      type,
      timestamp: serverTimestamp()
    });

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