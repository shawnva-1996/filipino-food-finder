// src/components/ui/ReviewsListModal.tsx
"use client";
import { useEffect, useState } from "react";
import { getStoreReviews } from "@/lib/db";
import { X, Star } from "lucide-react";

export default function ReviewsListModal({ storeId, onClose }: { storeId: string, onClose: () => void }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoreReviews(storeId).then(data => {
      setReviews(data);
      setLoading(false);
    });
  }, [storeId]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl w-full max-w-md h-[80vh] flex flex-col relative">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">Reviews ({reviews.length})</h3>
          <button onClick={onClose}><X size={24}/></button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {loading && <p>Loading...</p>}
          {!loading && reviews.length === 0 && <p className="text-gray-500 text-center">No reviews yet.</p>}
          
          {reviews.map(r => (
            <div key={r.id} className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                   {r.userPhoto ? <img src={r.userPhoto} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 bg-gray-200 rounded-full"/>}
                   <span className="font-bold text-sm">{r.userName}</span>
                </div>
                <div className="flex text-yellow-500 text-xs"><Star size={12} fill="currentColor"/> {r.rating}</div>
              </div>
              <p className="text-gray-700 text-sm mt-2">{r.comment}</p>
              {r.imageUrl && <img src={r.imageUrl} className="mt-2 rounded-lg max-h-40 object-cover" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}