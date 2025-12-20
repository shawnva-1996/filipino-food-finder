// src/app/my-business/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import BusinessForm from "@/components/forms/BusinessForm";
import { Plus, Edit, BarChart3, MousePointerClick, Eye } from "lucide-react";

export default function MyBusinessPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStores = async () => {
      const q = query(collection(db, "stores"), where("ownerId", "==", user.uid));
      const snap = await getDocs(q);
      setStores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchStores();
  }, [user]);

  if (loading) return <div className="p-10 text-center">Loading your businesses...</div>;

  // Render Edit Form
  if (editingStoreId) {
    const store = stores.find(s => s.id === editingStoreId);
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <button 
          onClick={() => setEditingStoreId(null)} 
          className="mb-6 text-gray-600 hover:text-blue-600 flex items-center gap-2 font-medium"
        >
          ← Back to Dashboard
        </button>
        <BusinessForm initialData={store} storeId={store.id} />
      </div>
    );
  }

  // Render Create Form
  if (isCreating) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <button 
          onClick={() => setIsCreating(false)} 
          className="mb-6 text-gray-600 hover:text-blue-600 flex items-center gap-2 font-medium"
        >
          ← Back to Dashboard
        </button>
        <BusinessForm />
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
           <div>
             <h1 className="text-3xl font-bold text-blue-900">My Businesses</h1>
             <p className="text-gray-600 mt-1">Manage your listings and track performance.</p>
           </div>
           <button 
             onClick={() => setIsCreating(true)} 
             className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm hover:bg-green-700 transition-colors"
           >
             <Plus size={20} /> Add New Business
           </button>
        </div>
        
        <div className="grid gap-6">
          {stores.map(store => (
            <div key={store.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-6">
              
              {/* Store Info */}
              <div className="flex-grow">
                 <div className="flex items-center gap-3 mb-2">
                   <h3 className="text-xl font-bold text-gray-900">{store.name}</h3>
                   <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${store.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {store.status}
                   </span>
                 </div>
                 <p className="text-gray-500 text-sm mb-4">{store.address}</p>
                 
                 {/* Analytics Section */}
                 <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                      <Eye size={16} className="text-blue-600" />
                      <div>
                        <span className="block text-xs text-blue-600 font-bold uppercase">Views</span>
                        <span className="block text-lg font-bold text-blue-900 leading-none">{store.views || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                      <MousePointerClick size={16} className="text-green-600" />
                      <div>
                        <span className="block text-xs text-green-600 font-bold uppercase">WA Clicks</span>
                        <span className="block text-lg font-bold text-green-900 leading-none">{store.whatsappClicks || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-100">
                      <BarChart3 size={16} className="text-purple-600" />
                      <div>
                        <span className="block text-xs text-purple-600 font-bold uppercase">Rating</span>
                        <span className="block text-lg font-bold text-purple-900 leading-none">
                          {store.rating ? store.rating.toFixed(1) : "N/A"}
                          <span className="text-xs font-normal text-purple-600 ml-1">({store.reviewsCount || 0})</span>
                        </span>
                      </div>
                    </div>
                 </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => setEditingStoreId(store.id)} 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 min-w-[100px]"
              >
                <Edit size={18} /> Edit
              </button>
            </div>
          ))}

          {stores.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">You haven't registered any businesses yet.</p>
              <button 
                onClick={() => setIsCreating(true)} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
              >
                Register Your First Business
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}