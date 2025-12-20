// src/components/ui/ReviewModal.tsx
"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { Star, X, Loader2, ImagePlus } from "lucide-react";

export default function ReviewModal({ storeId, onClose }: { storeId: string, onClose: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (!user) return alert("Please login");
    setSubmitting(true);
    
    try {
      let imageUrl = "";
      if (imageFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `reviews/${storeId}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const storeRef = doc(db, "stores", storeId);

      // Use Transaction to safely calculate new Average Rating
      await runTransaction(db, async (transaction) => {
        const storeDoc = await transaction.get(storeRef);
        if (!storeDoc.exists()) throw "Store does not exist!";
        
        const data = storeDoc.data();
        const newCount = (data.reviewsCount || 0) + 1;
        const newTotal = (data.ratingTotal || 0) + rating;
        const newAverage = newTotal / newCount;

        // 1. Create Review
        const reviewRef = doc(collection(db, "stores", storeId, "reviews"));
        transaction.set(reviewRef, {
          userId: user.uid,
          userName: user.displayName,
          userPhoto: user.photoURL,
          rating,
          comment,
          imageUrl,
          createdAt: serverTimestamp()
        });

        // 2. Update Store Stats
        transaction.update(storeRef, {
          reviewsCount: newCount,
          ratingTotal: newTotal,
          rating: newAverage
        });
      });

      alert("Review submitted!");
      onClose();
    } catch (e) {
      console.error(e);
      alert("Error submitting review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={24} /></button>
        <h3 className="text-xl font-bold mb-4">Write a Review</h3>
        
        <div className="flex gap-2 mb-4 justify-center">
          {[1,2,3,4,5].map(star => (
            <button key={star} onClick={() => setRating(star)}>
              <Star size={32} className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
            </button>
          ))}
        </div>

        <textarea className="w-full border p-3 rounded mb-4" placeholder="How was the food?" rows={3} value={comment} onChange={e => setComment(e.target.value)} />

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 font-medium">
            <ImagePlus size={20} />
            {imageFile ? "Selected: " + imageFile.name : "Add Photo (Optional)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} />
          </label>
        </div>

        <button onClick={submitReview} disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded font-bold flex justify-center">
          {submitting ? <Loader2 className="animate-spin" /> : "Submit Review"}
        </button>
      </div>
    </div>
  );
}