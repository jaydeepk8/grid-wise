"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/facility", label: "Facilities" },
    { href: "/summary", label: "Summary" },
  ];

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#4a6741]/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4a6741] text-3xl">eco</span>
            <span className="text-xl font-bold tracking-tight text-[#2d3a2d] font-serif">GridWise</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map(({ href, label }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link key={href} href={href}
                  className={`text-sm font-medium transition-colors ${isActive ? "text-[#4a6741] border-b-2 border-[#4a6741] pb-1" : "text-slate-500 hover:text-[#4a6741]"}`}>
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Auth section */}
        {!loading && (
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600 font-medium">
                  👋 {user?.name?.split(" ")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-[#4a6741]/30 text-[#4a6741] hover:bg-[#4a6741] hover:text-white transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login"
                  className="text-sm font-medium text-slate-500 hover:text-[#4a6741] transition-colors">
                  Sign in
                </Link>
                <Link href="/signup"
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-[#4a6741] text-white hover:bg-[#3a5331] transition-all">
                  Get started
                </Link>
              </>
            )}
          </div>
        )}

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className="material-symbols-outlined text-[#4a6741]">{menuOpen ? "close" : "menu"}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-[#4a6741]/10 px-6 py-4 flex flex-col gap-4">
          {links.map(({ href, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className={`text-sm font-medium py-2 transition-colors ${isActive ? "text-[#4a6741] font-semibold" : "text-slate-500 hover:text-[#4a6741]"}`}>
                {label}
              </Link>
            );
          })}
          <div className="border-t border-slate-100 pt-3">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-sm text-red-500 font-medium">
                Logout ({user?.name})
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-slate-600">Sign in</Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[#4a6741]">Create account</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

