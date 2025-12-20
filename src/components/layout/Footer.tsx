// src/components/layout/Footer.tsx
"use client";

import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white p-2 rounded-lg text-blue-900">
                <UtensilsCrossed size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight">Filipino Food Finder SG</span>
            </div>
            <p className="text-blue-200 text-sm max-w-sm">
              Connecting Filipinos in Singapore with the taste of home. 
              Find authentic dishes, support local businesses, and satisfy your cravings.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold mb-4 uppercase text-sm tracking-wider text-blue-300">Explore</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link href="/map" className="hover:text-white transition-colors">Find Food</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Join as Business</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4 uppercase text-sm tracking-wider text-blue-300">Contact</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>General Inquiries:</li>
              <li><a href="mailto:shawn@vizalliance.com.sg" className="font-bold hover:text-white">shawn@vizalliance.com.sg</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-12 pt-8 text-center text-sm text-blue-300">
          <p>© {new Date().getFullYear()} Filipino Food Finder SG. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}