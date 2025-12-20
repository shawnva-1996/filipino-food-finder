// src/app/register/page.tsx
"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { updateUserProfile } from "@/lib/db";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "business">("user");
  const [loading, setLoading] = useState(false);
  
  // Password Strength State
  const [strength, setStrength] = useState(0);
  const [validations, setValidations] = useState({
    length: false,
    number: false,
    special: false
  });

  useEffect(() => {
    setValidations({
      length: password.length >= 6,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [password]);

  useEffect(() => {
    let score = 0;
    if (validations.length) score++;
    if (validations.number) score++;
    if (validations.special) score++;
    setStrength(score);
  }, [validations]);

  const handleGoogleSignUp = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Create profile with selected role
      await updateUserProfile(result.user.uid, {
        uid: result.user.uid,
        email: result.user.email!,
        firstName: result.user.displayName?.split(" ")[0] || "",
        lastName: result.user.displayName?.split(" ")[1] || "",
        phoneNumber: "",
        role: role,
        favorites: []
      });
      if (role === "business") router.push("/my-business");
      else router.push("/");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strength < 2) return; // Enforce at least medium complexity
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      
      await updateUserProfile(cred.user.uid, {
        uid: cred.user.uid,
        email: email,
        firstName: "",
        lastName: "",
        phoneNumber: "",
        role: role,
        favorites: []
      });

      alert("Account created! Please check your email for verification.");
      if (role === "business") router.push("/my-business");
      else router.push("/");
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium mb-1">I am a...</label>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setRole("user")} className={`p-3 rounded border text-center transition-all ${role === "user" ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-gray-700 hover:bg-gray-50"}`}>
              Foodie (User)
            </button>
            <button type="button" onClick={() => setRole("business")} className={`p-3 rounded border text-center transition-all ${role === "business" ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-gray-700 hover:bg-gray-50"}`}>
              Business Owner
            </button>
          </div>
        </div>

        <button onClick={handleGoogleSignUp} className="w-full border border-gray-300 text-gray-700 py-2 rounded font-bold flex justify-center gap-2 hover:bg-gray-50 mb-6">
           <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="G" />
           Sign up with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or with email</span></div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
             <label className="block text-sm font-medium mb-1">Email</label>
             <input required type="email" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Password</label>
             <input required type="password" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
             
             {/* Complexity Bar */}
             <div className="flex gap-1 mt-2 h-1">
               <div className={`flex-1 rounded ${strength > 0 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
               <div className={`flex-1 rounded ${strength > 1 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
               <div className={`flex-1 rounded ${strength > 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
             </div>
             <div className="mt-2 text-xs space-y-1 text-gray-500">
               <p className={validations.length ? "text-green-600" : ""}>• At least 6 characters</p>
               <p className={validations.number ? "text-green-600" : ""}>• Contains a number</p>
               <p className={validations.special ? "text-green-600" : ""}>• Contains special char (!@#$)</p>
             </div>
          </div>

          <button disabled={loading || strength < 2} className="w-full bg-blue-600 text-white py-3 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account? <Link href="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}