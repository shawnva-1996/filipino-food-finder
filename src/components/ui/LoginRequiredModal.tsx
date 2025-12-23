"use client";

import { X, Lock } from "lucide-react";
import Link from "next/link";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={32} />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">Member Access Only</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Unlock the full experience! Join our community to view store details, write reviews, and save your favorites.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link 
            href="/login" 
            className="block w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-600/20"
          >
            Log In
          </Link>
          <Link 
            href="/register" 
            className="block w-full py-3 px-4 bg-white border-2 border-gray-100 hover:border-gray-300 text-gray-700 font-bold rounded-xl transition-all"
          >
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
}