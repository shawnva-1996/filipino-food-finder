"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Star, Loader2, Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import { DishReview, UserProfile } from "@/lib/types";
import { addReview, updateReview } from "@/lib/firebase-reviews";
import { uploadReviewImage } from "@/lib/storage-utils";
import Image from "next/image";

interface DishReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string | number;
  currentUser: UserProfile | null;
  existingReview?: DishReview | null; 
  defaultDishName?: string; 
  onReviewSuccess: () => void; 
}

export default function DishReviewModal({
  isOpen,
  onClose,
  restaurantId,
  currentUser,
  existingReview,
  defaultDishName = "", 
  onReviewSuccess,
}: DishReviewModalProps) {
  // Form State
  const [dishName, setDishName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  
  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Populate form
  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setDishName(existingReview.dishName);
        setRating(existingReview.rating);
        setComment(existingReview.comment);
        setPreviewUrl(existingReview.imageUrl || "");
      } else {
        setDishName(defaultDishName);
        setRating(5);
        setComment("");
        setPreviewUrl("");
      }
      setImageFile(null);
      setError("");
    }
  }, [existingReview, isOpen, defaultDishName]);

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic validation (2MB limit example)
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }

      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    setError("");

    const finalDishName = dishName.trim() === "" ? "General Review" : dishName;

    try {
      // 1. Upload Image if exists
      let finalImageUrl = existingReview?.imageUrl || ""; // Keep old image by default
      
      if (imageFile) {
        // Upload new image
        finalImageUrl = await uploadReviewImage(imageFile, "review_images");
      } else if (previewUrl === "" && existingReview?.imageUrl) {
        // If user removed the image in UI
        finalImageUrl = "";
      }

      // 2. Save to Firestore
      if (existingReview && existingReview.id) {
        await updateReview(existingReview.id, {
          dishName: finalDishName,
          rating,
          comment,
          imageUrl: finalImageUrl,
        });
      } else {
        await addReview({
          restaurantId,
          userId: currentUser.uid,
          userName: currentUser.displayName || "Anonymous",
          userPhoto: currentUser.photoURL || "",
          dishName: finalDishName,
          rating,
          comment,
          imageUrl: finalImageUrl,
        });
      }
      
      onReviewSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        setError("You don't have permission. Please log in.");
      } else {
        setError("Failed to submit review. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h3 className="font-bold text-gray-900 text-lg">
            {existingReview ? "Edit Review" : (defaultDishName ? `Rate ${defaultDishName}` : "Write a Review")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          {/* Dish Name (if optional) */}
          {(!defaultDishName && !existingReview) && (
             <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Review Type</label>
               <input
                 type="text"
                 placeholder="Enter Dish Name (or leave blank)"
                 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium text-gray-900"
                 value={dishName}
                 onChange={(e) => setDishName(e.target.value)}
               />
             </div>
          )}

          {/* Rating */}
          <div className="space-y-2 text-center">
            <div className="flex gap-2 justify-center py-3 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                >
                  <Star className={`w-9 h-9 ${star <= rating ? "fill-orange-400 text-orange-400" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <textarea
            required
            placeholder="How was the taste? portion size?"
            rows={4}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-gray-900 resize-none"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Add Photo</label>
            
            {!previewUrl ? (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-orange-400 hover:text-orange-500 transition-all"
              >
                <div className="bg-white p-3 rounded-full shadow-sm mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold">Tap to upload photo</span>
              </button>
            ) : (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 group">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                   <button
                     type="button"
                     onClick={() => fileInputRef.current?.click()}
                     className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40"
                   >
                     <ImageIcon className="w-5 h-5" />
                   </button>
                   <button
                     type="button"
                     onClick={removeImage}
                     className="p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Footer / Submit */}
        <div className="p-6 pt-0 flex-shrink-0 bg-white">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <span>{existingReview ? "Update Review" : "Post Review"}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}