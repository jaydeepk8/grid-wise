export default function Footer() {
  return (
    <footer className="bg-white/50 border-t border-[#e2e8e2] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-7">

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Left: Logo */}
          <div className="flex items-center gap-2 opacity-60">
            <span className="material-symbols-outlined text-[#4a6741] text-2xl">
              eco
            </span>
            <span className="text-lg font-serif font-bold tracking-tight text-[#2d3a2d]">
              EcoEnergy
            </span>
          </div>

          {/* Center: Copyright */}
          <p className="text-slate-400 text-sm font-light text-center">
            © 2024 EcoEnergy Systems. All rights reserved.
          </p>

          {/* Right: Links */}
          <div className="flex gap-6">
            <button className="text-slate-400 hover:text-[#4a6741] transition-colors text-sm">
              Privacy
            </button>
            <button className="text-slate-400 hover:text-[#4a6741] transition-colors text-sm">
              Terms
            </button>
            <button className="text-slate-400 hover:text-[#4a6741] transition-colors text-sm">
              Contact
            </button>
          </div>

        </div>

      </div>
    </footer>
  );
}