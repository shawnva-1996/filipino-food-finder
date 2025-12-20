// src/components/layout/Navbar.tsx
"use client";

import Link from 'next/link';
import { Menu, MapPin, User as UserIcon, UtensilsCrossed, LogOut, ShieldCheck, BarChart3, X, Heart } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAdmin, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <Link href="/" className="flex items-center gap-2" onClick={close}>
            <div className="bg-blue-800 p-2 rounded-lg text-white"><UtensilsCrossed size={24} /></div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-xl text-blue-900 tracking-tight">Filipino Food</span>
              <span className="font-bold text-sm text-red-600 uppercase tracking-widest">Finder SG</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {isAdmin && <Link href="/admin" className="text-red-600 font-bold flex items-center gap-1"><ShieldCheck size={18} /> Admin</Link>}
            <Link href="/map" className="flex items-center gap-1 text-gray-600 hover:text-blue-800 font-medium"><MapPin size={18} /> Find</Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/favorites" className="text-gray-500 hover:text-red-500" title="Favorites"><Heart size={20} /></Link>
                {profile?.role === "business" && <Link href="/my-business" className="text-gray-500 hover:text-blue-800" title="Dashboard"><BarChart3 size={20} /></Link>}
                <Link href="/profile" className="flex items-center gap-2 font-medium">
                   {user.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full border" /> : <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800">{user.displayName?.[0] || 'U'}</div>}
                </Link>
                <button onClick={() => logout()} className="text-gray-400 hover:text-red-600"><LogOut size={20} /></button>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1 text-gray-600 hover:text-blue-800 font-medium"><UserIcon size={18} /> Login</Link>
            )}
            <Link href="/register" className="bg-red-600 text-white px-5 py-2 rounded-full font-bold hover:bg-red-700 shadow-md">Join Now</Link>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2 text-gray-600" onClick={toggle}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-lg absolute w-full left-0 z-50">
          <Link href="/map" className="block py-2 text-gray-600 font-bold" onClick={close}>Find Food</Link>
          {isAdmin && <Link href="/admin" className="block py-2 text-red-600 font-bold" onClick={close}>Admin Dashboard</Link>}
          
          {user ? (
            <>
              <Link href="/favorites" className="block py-2 text-gray-600" onClick={close}>My Favorites</Link>
              <Link href="/profile" className="block py-2 text-gray-600" onClick={close}>My Profile</Link>
              {profile?.role === "business" && <Link href="/my-business" className="block py-2 text-blue-600 font-bold" onClick={close}>Business Dashboard</Link>}
              <button onClick={() => { logout(); close(); }} className="block w-full text-left py-2 text-gray-500">Logout</button>
            </>
          ) : (
            <Link href="/login" className="block py-2 text-gray-600" onClick={close}>Login</Link>
          )}
           <Link href="/register" className="block w-full text-center bg-red-600 text-white py-3 rounded-lg font-bold" onClick={close}>Join Now</Link>
        </div>
      )}
    </nav>
  );
}