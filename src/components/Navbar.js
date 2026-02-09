import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#4a6741]/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">

        {/* LEFT: Logo + Nav */}
        <div className="flex items-center gap-12">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4a6741] text-3xl">
              eco
            </span>
            <span className="text-xl font-bold tracking-tight text-[#2d3a2d] font-serif">
              EcoEnergy
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#"
              className="text-sm font-medium text-slate-500 hover:text-[#4a6741] transition-colors"
            >
              Home
            </Link>

            <Link
              href="/facility"
              className="text-sm font-medium text-[#4a6741] border-b-2 border-[#4a6741] pb-1"
            >
              Facilities
            </Link>

            <Link
              href="#"
              className="text-sm font-medium text-slate-500 hover:text-[#4a6741] transition-colors"
            >
              Summary
            </Link>

          
          </div>
        </div>

      </div>
    </nav>
  );
}
