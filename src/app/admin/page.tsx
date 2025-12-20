// src/app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, limit, doc, deleteDoc, updateDoc, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Trash2, Shield, Activity, Edit, X, User as UserIcon } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  
  // Data
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // UI State
  const [tab, setTab] = useState("activity"); // 'users' | 'stores' | 'activity' | 'reviews'
  const [selectedUser, setSelectedUser] = useState<string | null>(null); // For Per-User View
  const [sortField, setSortField] = useState("views");

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/");
    if (isAdmin) fetchData();
  }, [isAdmin, loading]);

  const fetchData = async () => {
    // 1. Fetch Users
    const usersSnap = await getDocs(collection(db, "users"));
    setUsers(usersSnap.docs.map(d => ({id: d.id, ...d.data()})));

    // 2. Fetch Stores
    const storesSnap = await getDocs(query(collection(db, "stores"), orderBy("createdAt", "desc")));
    setStores(storesSnap.docs.map(d => ({id: d.id, ...d.data()})));

    // 3. Fetch Recent Activity (Limit 100)
    const eventsSnap = await getDocs(query(collection(db, "events"), orderBy("timestamp", "desc"), limit(100)));
    setEvents(eventsSnap.docs.map(d => ({id: d.id, ...d.data()})));
  };

  // Actions
  const toggleApprove = async (storeId: string, currentStatus: string) => {
    // Explicit toggle logic
    const newStatus = currentStatus === "approved" ? "pending" : "approved";
    if(confirm(`Change status from ${currentStatus} to ${newStatus}?`)) {
      await updateDoc(doc(db, "stores", storeId), { status: newStatus });
      fetchData(); // Refresh
    }
  };

  const deleteItem = async (collectionName: string, id: string) => {
    if(confirm("Permanently delete this item?")) {
      await deleteDoc(doc(db, collectionName, id));
      fetchData();
    }
  };

  // Filtered Activity for Specific User
  const userEvents = selectedUser ? events.filter(e => e.userId === selectedUser) : [];

  if (loading || !isAdmin) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Super Admin Command Center</h1>
      
      {/* Tab Nav */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setTab("activity")} className={`px-4 py-2 rounded ${tab==="activity" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Live Activity</button>
        <button onClick={() => setTab("stores")} className={`px-4 py-2 rounded ${tab==="stores" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Stores ({stores.length})</button>
        <button onClick={() => setTab("users")} className={`px-4 py-2 rounded ${tab==="users" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Users ({users.length})</button>
      </div>

      {/* --- LIVE ACTIVITY TAB --- */}
      {tab === "activity" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Global Feed */}
           <div className="bg-black text-green-400 p-6 rounded-xl font-mono h-[500px] overflow-y-auto border border-gray-800">
             <h3 className="text-white font-bold mb-4 sticky top-0 bg-black pb-2 border-b border-gray-700">GLOBAL LIVE FEED</h3>
             {events.map(e => (
                <div key={e.id} className="mb-2 border-b border-gray-800 pb-1 text-xs md:text-sm">
                  <span className="text-gray-500">[{e.timestamp?.toDate().toLocaleTimeString()}]</span>
                  <button onClick={() => setSelectedUser(e.userId)} className="text-white hover:underline mx-1">User {e.userId.slice(0,4)}...</button>
                  {e.type === "whatsapp_click" ? <span className="text-green-500 font-bold">CLICKED WA</span> : <span className="text-blue-400">viewed store</span>}
                </div>
             ))}
           </div>

           {/* Per User Detail View */}
           <div className="bg-white p-6 rounded-xl border h-[500px] overflow-y-auto">
              <h3 className="font-bold mb-4 border-b pb-2">USER INSPECTOR</h3>
              {selectedUser ? (
                <div>
                   <div className="flex justify-between items-center mb-4">
                     <span className="font-bold text-lg">User ID: {selectedUser}</span>
                     <button onClick={() => setSelectedUser(null)}><X size={20}/></button>
                   </div>
                   <p className="mb-2">Total Actions Logged: {userEvents.length}</p>
                   <p className="mb-2">WA Clicks: <span className="text-green-600 font-bold">{userEvents.filter(e => e.type === "whatsapp_click").length}</span></p>
                   
                   <div className="mt-4 space-y-2">
                     {userEvents.map(e => (
                       <div key={e.id} className="bg-gray-50 p-2 rounded text-sm">
                          {e.type === "whatsapp_click" ? "Clicked WhatsApp" : "Viewed Store"} on {e.timestamp?.toDate().toLocaleString()}
                       </div>
                     ))}
                   </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center mt-20">Select a user from the live feed or user list to inspect their history.</p>
              )}
           </div>
        </div>
      )}

      {/* --- STORES TAB --- */}
      {tab === "stores" && (
        <div>
          <div className="flex gap-2 mb-4">
             <button onClick={() => setSortField("views")} className="text-xs bg-gray-100 px-2 py-1 rounded">Sort Views</button>
             <button onClick={() => setSortField("whatsappClicks")} className="text-xs bg-gray-100 px-2 py-1 rounded">Sort WA Clicks</button>
          </div>
          <div className="space-y-2">
            {[...stores].sort((a,b) => (b[sortField] || 0) - (a[sortField] || 0)).map(s => (
              <div key={s.id} className="flex flex-col md:flex-row justify-between bg-white p-4 shadow rounded border gap-4">
                <div>
                  <div className="font-bold text-lg">{s.name}</div>
                  <div className="text-xs text-gray-500">ID: {s.id} | Owner: {s.ownerEmail}</div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-blue-600 font-bold">Views: {s.views || 0}</span>
                    <span className="text-green-600 font-bold">WA Clicks: {s.whatsappClicks || 0}</span>
                    <span className="text-yellow-600 font-bold">Rating: {s.rating?.toFixed(1) || "N/A"} ({s.reviewsCount})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleApprove(s.id, s.status)} 
                    className={`px-4 py-2 rounded font-bold text-sm ${s.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                  >
                    {s.status === 'approved' ? 'APPROVED' : 'PENDING'}
                  </button>
                  <button onClick={() => deleteItem("stores", s.id)} className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {tab === "users" && (
        <table className="w-full bg-white shadow rounded-lg">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Inspect</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-4">
                  <div className="font-bold">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </td>
                <td className="p-4">{u.role}</td>
                <td className="p-4">
                  <button onClick={() => { setSelectedUser(u.id); setTab("activity"); }} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Activity size={16}/> See History
                  </button>
                </td>
                <td className="p-4">
                  <button onClick={() => deleteItem("users", u.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}