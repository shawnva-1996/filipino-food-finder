// src/app/map/page.tsx
import MapComponent from "@/components/map/MapComponent";

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Find Food Near You</h1>
          <p className="text-gray-600 mt-2">
            Discover Filipino restaurants, home-based businesses, and hidden gems in Singapore.
          </p>
        </div>

        {/* The Map */}
        <MapComponent />

        {/* Store List (Below Map) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {/* We can add a list view here later */}
           <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center text-gray-500">
              <p>Select a pin on the map to see details.</p>
           </div>
        </div>

      </div>
    </div>
  );
}