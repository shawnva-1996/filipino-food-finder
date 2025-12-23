"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    // 1. Define Routes
    // STRICT: Only Home is public. Everything else requires login.
    const publicRoutes = ["/"]; 
    
    // Auth routes (only accessible if NOT logged in)
    const authRoutes = ["/login", "/register", "/forgot-password"];
    
    const isPublic = publicRoutes.includes(pathname);
    const isAuthRoute = authRoutes.includes(pathname);

    // 2. Logic
    if (user && isAuthRoute) {
      // If logged in, kick out of Login/Register pages -> redirect to Home
      router.replace("/");
    } else if (!user && !isPublic && !isAuthRoute) {
      // If guest, kick out of ANY protected page -> redirect to Login
      router.replace("/login");
    } else {
      // Allow access
      setIsChecking(false);
    }

  }, [user, loading, pathname, router]);

  // Show loading spinner while AuthContext loads or while we check routes
  if (loading || isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-orange-600 font-bold">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}