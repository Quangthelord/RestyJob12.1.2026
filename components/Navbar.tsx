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
    <nav className="bg-white/95 backdrop-blur-md shadow-md border-b border-orange-100 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="hover:opacity-80 transition">
            <Logo size="xl" />
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/ai-matching"
              className="px-4 py-2 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg"
            >
              ✨ AI Matching
            </Link>
            <Link
              href="/marketplace"
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/business/dashboard"
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Doanh nghiệp
            </Link>
            <Link
              href="/worker/dashboard"
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Người lao động
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
