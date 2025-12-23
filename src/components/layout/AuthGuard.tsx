"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Define routes
    const publicRoutes = ["/", "/map"]; 
    const authRoutes = ["/login", "/register", "/forgot-password"];
    
    // Dynamic public routes (starts with /store)
    const isPublic = publicRoutes.includes(pathname) || pathname.startsWith("/store");
    const isAuthRoute = authRoutes.includes(pathname);

    // 1. Logged In User trying to access Auth pages -> Redirect to Home
    if (user && isAuthRoute) {
      router.replace("/");
      return;
    }

    // 2. Guest User trying to access Protected pages -> Redirect to Login
    if (!user && !isPublic && !isAuthRoute) {
      router.replace("/login");
      return;
    }

  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-orange-600 font-bold">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}