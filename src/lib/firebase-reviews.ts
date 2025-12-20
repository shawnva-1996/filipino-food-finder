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
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { DishReview } from "@/lib/types";

const REVIEWS_COLLECTION = "dish_reviews";

// --- HELPER: AGGREGATE RATINGS ---
// This calculates the new average for a dish and updates the Store document
const aggregateDishRatings = async (storeId: string, dishName: string) => {
  if (!storeId || !dishName || dishName === "General Review") return;

  try {
    // 1. Fetch all reviews for this specific dish
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("restaurantId", "==", storeId),
      where("dishName", "==", dishName)
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs;

    // 2. Calculate Stats
    const count = reviews.length;
    const total = reviews.reduce((sum, d) => sum + (d.data().rating || 0), 0);
    const avg = count > 0 ? total / count : 0;

    // 3. Update the Store's MenuItem
    const storeRef = doc(db, "stores", String(storeId));
    const storeSnap = await getDoc(storeRef);

    if (storeSnap.exists()) {
      const storeData = storeSnap.data();
      const menuItems = storeData.menuItems || [];
      
      // Find the specific dish in the menu array
      const itemIndex = menuItems.findIndex((item: any) => item.name === dishName);

      if (itemIndex > -1) {
        // Update the stats
        menuItems[itemIndex].avgRating = avg;
        menuItems[itemIndex].reviewCount = count;
        
        // Write back to Firestore
        await updateDoc(storeRef, { menuItems });
        console.log(`Updated ${dishName} stats: ${avg.toFixed(1)} stars (${count} reviews)`);
      }
    }
  } catch (error) {
    console.error("Aggregation failed:", error);
    // We don't throw here to avoid breaking the UI if stats fail to update
  }
};

// --- CREATE ---
export const addReview = async (review: Omit<DishReview, "id" | "createdAt">) => {
  try {
    // 1. Save the Review
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...review,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Trigger Aggregation to update Top Rated list
    await aggregateDishRatings(String(review.restaurantId), review.dishName);

    return { id: docRef.id, ...review };
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

// --- READ ---
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
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
    })) as DishReview[];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return []; 
  }
};

// --- UPDATE ---
export const updateReview = async (reviewId: string, updates: Partial<DishReview>) => {
  try {
    // 1. Update the Review
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await updateDoc(reviewRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // 2. Fetch the review to get the restaurant ID and Dish Name for aggregation
    // (We need these because 'updates' might not contain them)
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

    // 3. Aggregate (Recalculate stats without this review)
    if (meta) {
      await aggregateDishRatings(meta.restaurantId, meta.dishName);
    }

    return true;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};