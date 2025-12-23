"use client";

import { useEffect, useState } from "react";
// FIX: Import from the new reviews system
import { getReviewsByRestaurant } from "@/lib/firebase-reviews";
import { DishReview } from "@/lib/types";
import { X, Star, Calendar, Utensils, User } from "lucide-react";
import Image from "next/image";

interface ReviewsListModalProps {
  storeId: string;
  onClose: () => void;
}

export default function ReviewsListModal({ storeId, onClose }: ReviewsListModalProps) {
  const [reviews, setReviews] = useState<DishReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const data = await getReviewsByRestaurant(storeId);
        setReviews(data);
      } catch (error) {
        console.error("Failed to load reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchReviews();
    }
  }, [storeId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900 text-lg">All Reviews</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 text-gray-500 flex flex-col items-center">
              <Utensils size={40} className="text-gray-300 mb-2" />
              <p>No reviews yet.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border border-gray-200">
                      {review.userPhoto ? (
                        <Image src={review.userPhoto} alt={review.userName} width={40} height={40} className="object-cover h-full w-full" />
                      ) : (
                        <User className="text-gray-400 w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{review.userName || "Anonymous"}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={10} />
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recent"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex text-orange-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? "fill-current" : "text-gray-200"} />
                      ))}
                    </div>
                    {review.dishName && review.dishName !== "General Review" && (
                      <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full mt-1 font-bold">
                        {review.dishName}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-3 pl-[52px]">
                  {review.comment}
                </p>

                {review.imageUrl && (
                  <div className="pl-[52px]">
                    <div className="relative h-40 w-full md:w-64 rounded-lg overflow-hidden border border-gray-100">
                      <Image 
                        src={review.imageUrl} 
                        alt="Review Image" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}