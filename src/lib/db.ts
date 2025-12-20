// src/lib/db.ts
import { db } from "./firebase";
import { 
  collection, getDocs, query, where, doc, updateDoc, 
  increment, getDoc, setDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, orderBy, deleteDoc 
} from "firebase/firestore";

export interface Store {
  id: string;
  name: string;
  address: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  rating: number;
  ratingTotal?: number; 
  manualRating?: number;
  reviewsCount: number;
  contactNumber: string;
  status: string;
  ownerId: string;
  ownerEmail: string;
  priceRange?: string;
  region?: string;
  isHalal?: boolean;
  keywords?: string[];
  imageUrl?: string;
  views?: number;
  whatsappClicks?: number; // New metric
  isFeatured?: boolean;
  // New Social Links
  websiteUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  menuUrl?: string; // Image URL
  menuText?: string; // Text list
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  favorites?: string[]; 
  role: "user" | "business" | "admin"; // Explicit Role
  emailVerified?: boolean;
}

// --- CORE STORE FUNCTIONS ---

export async function getStores(searchTerm: string = "") {
  const storesRef = collection(db, "stores");
  const q = query(storesRef); 
  const snapshot = await getDocs(q);
  const allStores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Store[];

  let filtered = allStores.filter(store => store.status === 'approved');

  if (searchTerm) {
    const lowerTerm = searchTerm.toLowerCase();
    filtered = filtered.filter(store => 
      store.name.toLowerCase().includes(lowerTerm) || 
      store.description.toLowerCase().includes(lowerTerm) ||
      store.keywords?.some(k => k.toLowerCase().includes(lowerTerm))
    );
  }
  return filtered;
}

// --- USER & TRACKING FUNCTIONS ---

export async function getUserProfile(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, data, { merge: true });
}

export async function toggleFavorite(uid: string, storeId: string, isFavorite: boolean) {
  const ref = doc(db, "users", uid);
  if (isFavorite) {
    await updateDoc(ref, { favorites: arrayRemove(storeId) });
  } else {
    await updateDoc(ref, { favorites: arrayUnion(storeId) });
  }
}

// Analytics: Track Clicks
export async function trackEvent(userId: string, storeId: string, type: "view" | "whatsapp_click") {
  try {
    await addDoc(collection(db, "events"), {
      userId,
      storeId,
      type,
      timestamp: serverTimestamp()
    });

    const ref = doc(db, "stores", storeId);
    if (type === "view") {
      await updateDoc(ref, { views: increment(1) });
    } else if (type === "whatsapp_click") {
      await updateDoc(ref, { whatsappClicks: increment(1) });
    }
  } catch (e) { console.error("Tracking Error:", e); }
}

// Helper to get reviews for a store
export async function getStoreReviews(storeId: string) {
  const q = query(collection(db, "stores", storeId, "reviews"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}