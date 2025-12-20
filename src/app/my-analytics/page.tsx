// src/app/my-business/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import BusinessForm from "@/components/forms/BusinessForm";
import Link from "next/link";

export default function MyBusinessPage() {
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStore = async () => {
      const q = query(collection(db, "stores"), where("ownerId", "==", user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setStore({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
      setLoading(false);
    };
    fetchStore();
  }, [user]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">Manage Business</h1>
        {store ? (
          <BusinessForm initialData={store} storeId={store.id} />
        ) : (
          <div className="bg-white p-10 rounded text-center">
            <p className="mb-4">No business found.</p>
            <Link href="/register-business" className="bg-red-600 text-white px-6 py-2 rounded">Register Now</Link>
          </div>
        )}
      </div>
    </div>
  );
}