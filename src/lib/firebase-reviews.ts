import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { DishReview } from "@/lib/types";

const REVIEWS_COLLECTION = "dish_reviews";

// --- HELPER: AGGREGATE RATINGS ---
const aggregateDishRatings = async (storeId: string, dishName: string) => {
  if (!storeId || !dishName || dishName === "General Review") return;

  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("restaurantId", "==", String(storeId)),
      where("dishName", "==", dishName)
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs;

    const count = reviews.length;
    const total = reviews.reduce((sum, d) => sum + (d.data().rating || 0), 0);
    const avg = count > 0 ? total / count : 0;

    const storeRef = doc(db, "stores", String(storeId));
    const storeSnap = await getDoc(storeRef);

    if (storeSnap.exists()) {
      const storeData = storeSnap.data();
      const menuItems = storeData.menuItems || [];
      const itemIndex = menuItems.findIndex((item: any) => item.name === dishName);

      if (itemIndex > -1) {
        menuItems[itemIndex].avgRating = avg;
        menuItems[itemIndex].reviewCount = count;
        await updateDoc(storeRef, { menuItems });
      }
    }
  } catch (error) {
    console.error("Aggregation failed:", error);
  }
};

// --- CREATE ---
export const addReview = async (review: Omit<DishReview, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...review,
      restaurantId: String(review.restaurantId), // Ensure string for indexing consistency
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await aggregateDishRatings(String(review.restaurantId), review.dishName);
    return { id: docRef.id, ...review };
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

// --- READ: BY RESTAURANT (Public) ---
export const getReviewsByRestaurant = async (restaurantId: string | number) => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("restaurantId", "==", String(restaurantId)),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
    })) as DishReview[];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return []; 
  }
};

// --- READ: BY USER (Profile Page) ---
export const getUserReviews = async (userId: string) => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
    })) as DishReview[];
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }
};

// --- READ: ALL REVIEWS (Admin Page) ---
export const getAllReviews = async () => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(100) // Safety limit for admin view
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
    })) as DishReview[];
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return [];
  }
};

// --- UPDATE ---
export const updateReview = async (reviewId: string, updates: Partial<DishReview>) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await updateDoc(reviewRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Re-aggregate based on current state (fetched fresh to ensure we have restaurantId)
    const snap = await getDoc(reviewRef);
    if (snap.exists()) {
      const data = snap.data();
      await aggregateDishRatings(data.restaurantId, data.dishName);
    }
    return true;
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
};

// --- DELETE ---
export const deleteReview = async (reviewId: string) => {
  try {
    // 1. Get data before deleting so we know what to aggregate
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const snap = await getDoc(reviewRef);
    let meta = null;
    
    if (snap.exists()) {
      meta = snap.data();
    }

    // 2. Delete
    await deleteDoc(reviewRef);

    // 3. Aggregate
    if (meta) {
      await aggregateDishRatings(meta.restaurantId, meta.dishName);
    }
    return true;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};