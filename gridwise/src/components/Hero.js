"use client";

import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">

      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/facilities/home_tree.png"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay for text readability */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgba(200,215,195,0.55) 0%, rgba(200,215,195,0.2) 55%, transparent 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-10 pt-40 pb-24 w-full">

        {/* Badge */}
        <div className="inline-flex items-center border border-[#4a6741]/40 rounded-full px-4 py-1.5 mb-8">
          <span className="text-[#3a5030] text-[10px] font-semibold uppercase tracking-[0.2em]">
            Pioneering Net Zero
          </span>
        </div>

        {/* Heading */}
        <h1
          className="text-6xl md:text-7xl lg:text-[80px] text-[#1e2d1e] leading-[1.05] mb-10 max-w-2xl"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
        >
          Empowering
          <br />
          Essential
          <br />
          Services with
          <br />
          Sustainable
          <br />
          Energy.
        </h1>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/facility"
            className="bg-[#1e2d1e] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[#2d4a2d] transition-all duration-300"
          >
            Get Started
          </Link>
          <Link
            href=""
            className="bg-white/70 backdrop-blur-sm border border-[#4a6741]/20 text-[#1e2d1e] px-7 py-3.5 rounded-full text-sm font-medium hover:bg-white transition-all duration-300"
          >
            Learn More
          </Link>
        </div>

      </div>
    </section>
  );
}