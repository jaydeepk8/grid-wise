"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/facility", label: "Facilities" },
    { href: "/summary", label: "Summary" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#4a6741]/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">

        <div className="flex items-center gap-12">

          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4a6741] text-3xl">
              eco
            </span>
            <span className="text-xl font-bold tracking-tight text-[#2d3a2d] font-serif">
              Lumiq
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[#4a6741] border-b-2 border-[#4a6741] pb-1"
                      : "text-slate-500 hover:text-[#4a6741]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="md:hidden ml-auto">
          <span className="material-symbols-outlined text-[#4a6741]">menu</span>
        </div>

      </div>
    </nav>
  );
}