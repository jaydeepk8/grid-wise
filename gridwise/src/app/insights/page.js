"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import { facilityConfig } from "@/lib/facilityConfig";

export default function InsightsPage() {
  const facilities = Object.entries(facilityConfig);

  return (
    <div className="bg-[#f1f4f1] min-h-screen flex flex-col pt-32">
      <div className="max-w-5xl mx-auto px-4 md:px-6 w-full flex-1">

        <div className="bg-[#eef3ec] rounded-3xl px-6 md:px-10 py-8 mb-10">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Analytics</p>
          <h1 className="text-4xl font-serif text-[#2d3a2d] mb-2">AI Insights</h1>
          <p className="text-slate-500 max-w-xl">
            Select a facility to view its AI-generated energy insights, predictions and recommendations.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-16">
          {facilities.map(([id, facility]) => (
            <Link key={id} href={`/facility/${id}`}
              className="bg-white rounded-2xl px-6 md:px-10 py-6 flex items-center justify-between shadow-sm hover:shadow-md hover:border-[#4a6741]/20 border border-transparent transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#4a6741]/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#4a6741] text-2xl">{facility.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-0.5">{facility.category}</p>
                  <h2 className="text-xl font-serif text-[#2d3a2d]">{facility.name}</h2>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-[#4a6741] transition-colors">arrow_forward</span>
            </Link>
          ))}
        </div>

      </div>
      <Footer />
    </div>
  );
}
