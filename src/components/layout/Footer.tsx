// src/components/layout/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Filipino Food Finder</h3>
            <p className="text-gray-500 text-sm">
              Connecting the Filipino community in Singapore through the taste of home.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="/map" className="hover:text-orange-600">Browse Map</a></li>
              <li><a href="/login" className="hover:text-orange-600">Login</a></li>
              <li><a href="/register-business" className="hover:text-orange-600">Add Your Business</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Contact</h4>
            <p className="text-sm text-gray-500">
              Questions? Email us at:<br/>
              <a href="mailto:support@filipinofoodfinder.sg" className="text-orange-600">support@filipinofoodfinder.sg</a>
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Filipino Food Finder. All rights reserved.
        </div>
      </div>
    </footer>
  );
}