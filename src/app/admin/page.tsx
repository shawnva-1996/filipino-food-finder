// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, limit, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Trash2, X, Download, Star, Activity } from "lucide-react";
// FIX: Updated import to point to the file in the same directory (./)
import AdminReviewManager from "./AdminReviewManager";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // State for original tabs
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  
  // UI State
  const [tab, setTab] = useState("activity");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [sortField, setSortField] = useState("views");

  // Determine Admin Status (using email or custom claim logic)
  const isAdmin = user?.email === "shawnlemuelevoradabi@gmail.com";

  useEffect(() => {
    if (!loading) {
      if (!isAdmin) {
        router.push("/");
      } else {
        fetchData();
      }
    }
  }, [isAdmin, loading, router]);

  const fetchData = async () => {
    try {
      // 1. Users
      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map(d => ({id: d.id, ...d.data()})));

      // 2. Stores (Sorted by Created Desc)
      const storesSnap = await getDocs(query(collection(db, "stores"), orderBy("createdAt", "desc")));
      setStores(storesSnap.docs.map(d => ({id: d.id, ...d.data()})));

      // 3. Events (Last 100)
      const eventsSnap = await getDocs(query(collection(db, "events"), orderBy("timestamp", "desc"), limit(100)));
      setEvents(eventsSnap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (error) {
      console.error("Admin data fetch error:", error);
    }
  };

  // --- ACTIONS ---

  const toggleApprove = async (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === "approved" ? "pending" : "approved";
    if(confirm(`Change status from ${currentStatus} to ${newStatus}?`)) {
      await updateDoc(doc(db, "stores", storeId), { status: newStatus });
      fetchData(); // Refresh list
    }
  };

  const toggleFeatured = async (storeId: string, isFeatured: boolean) => {
    await updateDoc(doc(db, "stores", storeId), { isFeatured: !isFeatured });
    fetchData(); // Refresh list
  };

  const deleteItem = async (col: string, id: string) => {
    if(confirm(`Permanently delete this item from ${col}?`)) {
      await deleteDoc(doc(db, col, id));
      fetchData(); // Refresh list
    }
  };

  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "First Name,Last Name,Email,Phone,Role\n"
      + users.map(u => `${u.firstName},${u.lastName},${u.email},${u.phoneNumber},${u.role}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_list.csv");
    document.body.appendChild(link);
    link.click();
  };

  const userEvents = selectedUser ? events.filter(e => e.userId === selectedUser) : [];

  if (loading || !isAdmin) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Admin...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Super Admin Command Center</h1>
      
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
        <button onClick={() => setTab("activity")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab==="activity" ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>Live Activity</button>
        <button onClick={() => setTab("reviews")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab==="reviews" ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>Reviews</button>
        <button onClick={() => setTab("stores")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab==="stores" ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>Stores ({stores.length})</button>
        <button onClick={() => setTab("users")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab==="users" ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>Users ({users.length})</button>
      </div>

      {/* --- ACTIVITY TAB --- */}
      {tab === "activity" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
           {/* Live Feed */}
           <div className="bg-black text-green-400 p-6 rounded-xl font-mono h-[600px] overflow-y-auto border border-gray-800 shadow-xl">
             <h3 className="text-white font-bold mb-4 sticky top-0 bg-black pb-2 border-b border-gray-700 flex justify-between items-center">
               <span>GLOBAL LIVE FEED</span>
               <span className="text-xs font-normal text-gray-500 animate-pulse">● LIVE</span>
             </h3>
             {events.length === 0 && <p className="text-gray-600 text-sm italic">No recent events.</p>}
             {events.map(e => (
                <div key={e.id} className="mb-3 border-b border-gray-900 pb-2 text-xs md:text-sm font-mono">
                  <span className="text-gray-600 mr-2">[{e.timestamp?.toDate().toLocaleTimeString()}]</span>
                  <button onClick={() => setSelectedUser(e.userId)} className="text-yellow-500 hover:underline hover:text-yellow-400 font-bold mx-1">
                    User {e.userId.slice(0,5)}
                  </button>
                  {e.type === "whatsapp_click" ? (
                    <span className="text-green-500 font-bold ml-1">➔ CLICKED WA</span> 
                  ) : (
                    <span className="text-blue-400 ml-1">➔ viewed store</span>
                  )}
                  {e.storeId && <span className="text-gray-500 block ml-14 text-xs">Store ID: {e.storeId}</span>}
                </div>
             ))}
           </div>

           {/* User Inspector */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[600px] overflow-y-auto">
              <h3 className="font-bold mb-4 border-b pb-2 text-gray-900">USER INSPECTOR</h3>
              {selectedUser ? (
                <div>
                   <div className="flex justify-between items-center mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                     <div>
                       <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Inspecting</span>
                       <div className="font-mono text-lg font-bold text-gray-900">{selectedUser}</div>
                     </div>
                     <button onClick={() => setSelectedUser(null)} className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-100"><X size={18}/></button>
                   </div>
                   
                   <p className="mb-4 text-sm font-bold text-gray-500">Total Actions: {userEvents.length}</p>
                   
                   <div className="space-y-3">
                     {userEvents.map(e => (
                       <div key={e.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.type === "whatsapp_click" ? "bg-green-500" : "bg-blue-500"}`}></div>
                          <div>
                            <div className="font-bold text-gray-800">
                              {e.type === "whatsapp_click" ? "Clicked WhatsApp" : "Viewed Store"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {e.timestamp?.toDate().toLocaleString()}
                            </div>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Activity size={48} className="mb-4 text-gray-200"/>
                  <p>Select a user from the Live Feed to inspect their history.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* --- REVIEWS TAB --- */}
      {tab === "reviews" && (
        <div className="animate-in fade-in">
          {/* We use the new Component here */}
          <AdminReviewManager />
        </div>
      )}

      {/* --- STORES TAB --- */}
      {tab === "stores" && (
        <div className="animate-in fade-in">
          <div className="flex gap-2 mb-4">
             <button onClick={() => setSortField("views")} className={`text-xs px-3 py-1.5 rounded font-bold ${sortField === 'views' ? 'bg-blue-100 text-blue-700' : 'bg-white border text-gray-600'}`}>Sort by Views</button>
             <button onClick={() => setSortField("whatsappClicks")} className={`text-xs px-3 py-1.5 rounded font-bold ${sortField === 'whatsappClicks' ? 'bg-green-100 text-green-700' : 'bg-white border text-gray-600'}`}>Sort by WhatsApp</button>
          </div>
          
          <div className="space-y-4">
            {[...stores].sort((a,b) => (b[sortField] || 0) - (a[sortField] || 0)).map(s => (
              <div key={s.id} className="flex flex-col md:flex-row justify-between bg-white p-5 shadow-sm rounded-xl border border-gray-100 gap-4 hover:border-blue-300 transition-colors">
                <div>
                  <div className="font-bold text-lg flex items-center gap-2 text-gray-900">
                    {s.name}
                    {s.isFeatured && <Star size={16} className="fill-yellow-400 text-yellow-400" />}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">ID: {s.id} • Owner: {s.ownerEmail}</div>
                  <div className="flex gap-4 mt-2 text-sm bg-gray-50 inline-flex px-3 py-2 rounded-lg">
                    <span className="text-blue-600 font-bold flex items-center gap-1">Views: {s.views || 0}</span>
                    <span className="w-px h-4 bg-gray-300"></span>
                    <span className="text-green-600 font-bold flex items-center gap-1">WA Clicks: {s.whatsappClicks || 0}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => toggleFeatured(s.id, s.isFeatured)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${s.isFeatured ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                    {s.isFeatured ? "★ Featured" : "☆ Set Featured"}
                  </button>
                  <button onClick={() => toggleApprove(s.id, s.status)} className={`px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wide ${s.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {s.status}
                  </button>
                  <button onClick={() => deleteItem("stores", s.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {tab === "users" && (
        <div className="animate-in fade-in">
          <div className="flex justify-end mb-4">
            <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-sm font-bold text-sm">
               <Download size={16}/> Export User Data (CSV)
            </button>
          </div>
          
          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">User</th>
                  <th className="p-4 font-bold">Contact</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-gray-400 font-mono">{u.id}</div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="text-gray-900">{u.email}</div>
                      <div className="text-gray-500">{u.phoneNumber}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold uppercase">{u.role}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => deleteItem("users", u.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <Trash2 size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}