"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Star, MoreHorizontal, Trash2, Edit2, User } from "lucide-react";
import { DishReview, UserProfile } from "@/lib/types";
import { getReviewsByRestaurant, deleteReview } from "@/lib/firebase-reviews";
import DishReviewModal from "./DishReviewModal";

interface ReviewsListProps {
  restaurantId: string | number;
  currentUser: UserProfile | null; // Pass null if not logged in
}

export default function ReviewsList({ restaurantId, currentUser }: ReviewsListProps) {
  const [reviews, setReviews] = useState<DishReview[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<DishReview | null>(null);

  // Initial Fetch
  const fetchReviews = async () => {
    setLoading(true);
    const data = await getReviewsByRestaurant(restaurantId);
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [restaurantId]);

  // Handlers
  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(reviewId);
      // Optimistic update or refetch
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (error) {
      alert("Failed to delete review");
    }
  };

  const handleEdit = (review: DishReview) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingReview(null);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Header Section */}
      <div className="flex justify-between items-center px-4 md:px-0">
        <h2 className="text-xl font-bold text-gray-900">
          Dish Reviews <span className="text-gray-400 text-sm font-normal">({reviews.length})</span>
        </h2>
        
        {currentUser ? (
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-sm"
          >
            + Write Review
          </button>
        ) : (
          <span className="text-xs text-gray-500 italic">Log in to review</span>
        )}
      </div>

      {/* List Section */}
      <div className="space-y-4 px-4 md:px-0">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm mb-2">No reviews yet.</p>
            <p className="text-orange-600 text-xs font-medium">Be the first to review a dish!</p>
          </div>
        ) : (
          reviews.map((review) => {
            const isOwner = currentUser?.uid === review.userId;
            const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
            const canManage = isOwner || isAdmin;

            return (
              <div 
                key={review.id} 
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Review Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                      {review.userPhoto ? (
                        <Image 
                          src={review.userPhoto} 
                          alt={review.userName} 
                          width={40} 
                          height={40} 
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    {/* User Info & Date */}
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">
                        {review.userName}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Just now'}
                      </p>
                    </div>
                  </div>

                  {/* Actions (Edit/Delete) - Only if authorized */}
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEdit(review)}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => review.id && handleDelete(review.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Rating & Dish Tag */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= review.rating ? "fill-orange-400 text-orange-400" : "text-gray-200"}`} 
                      />
                    ))}
                  </div>
                  <div className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-md border border-orange-100 uppercase tracking-wide">
                    {review.dishName}
                  </div>
                </div>

                {/* Comment */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {review.comment}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Component */}
      <DishReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantId={restaurantId}
        currentUser={currentUser}
        existingReview={editingReview}
        onReviewSuccess={fetchReviews}
      />
    </div>
  );
}