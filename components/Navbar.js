"use client";

import Link from "next/link";
import { Home } from "lucide-react"; // <-- Import the icon

export default function Navbar() {
  return (
    <nav className="fixed top-4 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-md w-fit rounded-full mx-auto bg-black/30 dark:bg-black/30 border border-white/50 px-4 shadow-lg flex items-center justify-center">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="h-16 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/gdg-logo.png" alt="GDG SCREIT Logo" className="w-full h-full object-contain" />
            </div>
          </Link>

          {/* Center: Links (Now visible on all screens) */}
          <div className="flex items-center space-x-6 ml-6"> {/* <-- MODIFIED: 'flex', 'ml-6', 'space-x-6' */}
            
            {/* Home Icon Link */}
            <Link href="/" className="text-sm font-medium text-gray-200 dark:text-gray-100 hover:text-indigo-600 transition">
              <Home size={20} />
            </Link>
            
            {/* Tracker Link */}
            <Link href="/tracker" className="text-sm font-medium text-gray-200 dark:text-gray-100 hover:text-indigo-600 transition">
              Tracker
            </Link>
            
            {/* You can add more links here, like the original "Events" one */}
            {/* <Link href="/event/example" className="text-sm font-medium text-gray-800 dark:text-gray-100 hover:text-indigo-600 transition">Events</Link> */}
          
          </div>

          {/* Right: Small utilities (Still commented out, as per original) */}
          {/* <div className="flex items-center space-x-3">
             <Link href="https://gdg.community.dev/gdg-screit/" target="_blank" className="text-sm text-gray-700 dark:text-gray-200 hover:text-indigo-600 transition">Community</Link>
           </div> */}
        </div>
      </div>
    </nav>
  );
}