"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Logo from "./Logo";

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl minimal-shadow border-b border-gray-100/50 sticky top-0 z-40 relative">
      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial-subtle pointer-events-none opacity-30"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Logo size="xl" />
          </Link>

          <div className="flex items-center gap-8">
            <Link
              href="/ai-matching"
              className="px-5 py-2.5 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition-all font-medium minimal-shadow-lg text-sm"
            >
              AI Matching
            </Link>
            <Link
              href="/marketplace"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
            >
              Marketplace
            </Link>
            <Link
              href="/business/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
            >
              Doanh nghiệp
            </Link>
            <Link
              href="/worker/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
            >
              Người lao động
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
