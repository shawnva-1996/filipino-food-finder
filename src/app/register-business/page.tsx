// src/app/register-business/page.tsx
"use client";

import BusinessForm from "@/components/forms/BusinessForm";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function RegisterBusinessPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-blue-900">Join the Filipino Food Alliance</h1>
          <p className="mt-4 text-gray-600">
            List your business for free and help Filipinos in Singapore find you.
          </p>
        </div>

        {user ? (
          <BusinessForm />
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Please Login First</h2>
            <p className="text-gray-500 mb-6">You need an account to manage your business listing.</p>
            <Link 
              href="/login" 
              className="inline-block bg-blue-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}