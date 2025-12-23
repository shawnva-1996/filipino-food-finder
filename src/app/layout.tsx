import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthGuard from "@/components/layout/AuthGuard"; // Import the guard

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Filipino Food Finder",
  description: "Discover the best Filipino food in Singapore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthGuard> {/* Wrap content with AuthGuard */}
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}