"use client";

import React, { useEffect, useState } from "react";
import { getAllReviews, deleteReview } from "@/lib/firebase-reviews";
import { DishReview } from "@/lib/types";
import { Trash2, Edit2, Search, Filter, Star, AlertCircle } from "lucide-react";
import DishReviewModal from "@/components/ui/DishReviewModal";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function AdminReviewManager() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<DishReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit State
  const [editingReview, setEditingReview] = useState<DishReview | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const data = await getAllReviews();
    setReviews(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ADMIN ACTION: Are you sure you want to permanently delete this review?")) return;
    try {
      await deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Failed to delete review.");
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.dishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Header & Tools */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Review Management</h2>
          <p className="text-sm text-gray-500">Super Admin access to all user reviews</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search reviews..." 
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Dish / Rating</th>
              <th className="px-6 py-4">Comment</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
               <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading reviews...</td></tr>
            ) : filteredReviews.length === 0 ? (
               <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No reviews found.</td></tr>
            ) : (
              filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                        {review.userPhoto ? (
                          <Image src={review.userPhoto} alt="u" width={32} height={32} className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {review.userName?.[0] || "U"}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{review.userName}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[100px]">{review.userId}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900">{review.dishName}</span>
                      <div className="flex text-orange-400">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} size={12} className={i < review.rating ? "fill-current" : "text-gray-200"} />
                        ))}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <p className="line-clamp-2 max-w-xs">{review.comment}</p>
                    {review.imageUrl && (
                      <a href={review.imageUrl} target="_blank" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        View Photo
                      </a>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "-"}
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingReview(review)}
                        className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-md transition-colors"
                        title="Edit Review"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => review.id && handleDelete(review.id)}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Edit Modal */}
      {editingReview && (
        <DishReviewModal
          isOpen={!!editingReview}
          onClose={() => setEditingReview(null)}
          restaurantId={editingReview.restaurantId}
          currentUser={user} // Pass current admin user
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