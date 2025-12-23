"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserReviews, deleteReview } from "@/lib/firebase-reviews";
import { DishReview } from "@/lib/types";
import { Star, Trash2, Edit2, MapPin, Calendar, Utensils } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DishReviewModal from "@/components/ui/DishReviewModal";

export default function MyReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [reviews, setReviews] = useState<DishReview[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [editingReview, setEditingReview] = useState<DishReview | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchReviews();
    }
  }, [user, authLoading]);

  const fetchReviews = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserReviews(user.uid);
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Failed to delete review.");
    }
  };

  if (authLoading || (loading && !reviews.length)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading your reviews...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-500">Manage your dining history and ratings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {reviews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <h3 className="text-lg font-bold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-500 mb-6">You haven't rated any dishes yet.</p>
            <Link href="/" className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700">
              Find Food to Review
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                
                {/* Image Section */}
                <div className="w-full md:w-48 h-48 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                  {review.imageUrl ? (
                    <Image src={review.imageUrl} alt={review.dishName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Utensils className="w-8 h-8 mb-2 opacity-50"/>
                      <span className="text-xs">No Photo</span>
                    </div>
                  )}
                  {review.dishName !== "General Review" && (
                     <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-bold">
                       {review.dishName}
                     </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {/* If we had storeName stored in review, we'd show it here. 
                            If not, we just show "Store ID: ..." or fetch it. 
                            Assuming logic handles storeName or user knows context. 
                            Ideally, store StoreName in Review doc for easier display. */}
                        Review for Store
                      </h3>
                      <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                        <Calendar className="w-3 h-3"/>
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recent"}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setEditingReview(review)}
                         className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                       >
                         <Edit2 className="w-4 h-4"/>
                       </button>
                       <button 
                         onClick={() => review.id && handleDelete(review.id)}
                         className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                       >
                         <Trash2 className="w-4 h-4"/>
                       </button>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "fill-orange-400 text-orange-400" : "text-gray-200"}`} />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-grow">
                    {review.comment}
                  </p>
                  
                  <Link 
                    href={`/store/${review.restaurantId}`} 
                    className="self-start text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline mt-auto"
                  >
                    View Restaurant <MapPin className="w-3 h-3"/>
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingReview && (
        <DishReviewModal
          isOpen={!!editingReview}
          onClose={() => setEditingReview(null)}
          restaurantId={editingReview.restaurantId}
          currentUser={user}
          existingReview={editingReview}
          onReviewSuccess={() => {
            fetchReviews();
            setEditingReview(null);
          }}
        />
      )}
    </div>
  );
}