// src/app/forgot-password/page.tsx
"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        
        {!sent ? (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-gray-600 text-sm">Enter your email and we'll send you a link to reset your password.</p>
            <input 
              required 
              type="email" 
              placeholder="Enter your email" 
              className="w-full border p-3 rounded-lg"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg text-green-700">
            <p>✅ Check your email! We sent a password reset link to <b>{email}</b>.</p>
          </div>
        )}
        
        <div className="mt-6">
          <Link href="/login" className="text-sm text-gray-500 hover:text-blue-600">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}