// src/app/page.tsx
import Hero from "@/components/ui/Hero";
import FeaturedGrid from "@/components/ui/FeaturedGrid";
import Link from "next/link";
import { Map } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 1. The Hero Banner */}
      <Hero />

      {/* 2. Main Feature: Map Teaser */}
      <section className="bg-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Find Food Near You</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Explore our interactive map to see which restaurants, stalls, and home-based businesses are open right now.
          </p>
          
          <div className="relative w-full max-w-4xl mx-auto h-64 bg-gray-200 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden group cursor-pointer">
             {/* Map Placeholder Graphic */}
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80')] bg-cover opacity-50 group-hover:scale-105 transition-transform"></div>
             
             <Link href="/map" className="relative z-10 bg-white text-orange-600 px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-orange-50 transition-colors">
                <Map size={20} />
                Open Interactive Map
             </Link>
          </div>
        </div>
      </section>

      {/* 3. Featured Food */}
      <FeaturedGrid />
      
      {/* 4. Business CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Are you a Business Owner?</h2>
          <p className="text-gray-400 mb-8">
            List your restaurant or home-based business for free and reach thousands of Filipinos in Singapore.
          </p>
          <Link href="/register-business" className="bg-orange-600 px-8 py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors inline-block">
            Join the Alliance
          </Link>
        </div>
      </section>

    </div>
  );
}