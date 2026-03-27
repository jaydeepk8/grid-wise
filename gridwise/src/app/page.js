"use client";

import Hero from "@/components/Hero";;
import Working from "@/components/Working";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="bg-[#f1f4f1] min-h-screen">
      <Hero />
      <Working />
      <Footer />
    </div>
  );
}