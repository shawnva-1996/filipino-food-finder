// src/app/login/page.tsx
"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { loginGoogle, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  if (user) router.push("/"); 

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      alert("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Welcome Back</h1>

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input required type="email" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input required type="password" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
            <div className="text-right mt-1">
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot Password?</Link>
            </div>
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded font-bold flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : "Login"}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
        </div>

        <button onClick={loginGoogle} className="w-full border border-gray-300 text-gray-700 py-2 rounded font-bold flex justify-center gap-2 hover:bg-gray-50 items-center">
           <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
           <span>Google</span>
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          No account? <Link href="/register" className="text-blue-600 font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}