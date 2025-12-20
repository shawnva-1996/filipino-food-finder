// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import OnboardingModal from "@/components/forms/OnboardingModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Filipino Food Finder | SG",
  description: "Find the best Filipino food in Singapore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col min-h-screen bg-white text-gray-900`}>
        <AuthProvider>
          <Navbar />
          <OnboardingModal />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}