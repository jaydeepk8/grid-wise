"use client";

import Footer from "@/components/Footer";
import { generateReport } from "@/lib/generateReport";

const facilities = [
  { id: "hospital", name: "General Hospital", category: "Essential Service", status: "Optimal", hasData: true },
  { id: "data-center", name: "Data Center", category: "Critical Infrastructure", status: "High Demand", hasData: false },
  { id: "mnc", name: "MNC", category: "Corporate Excellence", status: "Efficient", hasData: false },
];

export default function SummaryPage() {
  return (
    <div className="bg-[#f1f4f1] min-h-screen flex flex-col pt-32">
      <div className="max-w-5xl mx-auto px-6 w-full flex-1">

        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold mb-3">
            Overview
          </p>
          <h1
            className="text-5xl text-[#2d3a2d]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
          >
            Facility Summary
          </h1>
        </div>

        <div className="flex flex-col gap-4 mb-16">
          {facilities.map((facility) => (
            <div key={facility.id} className="bg-white rounded-2xl px-10 py-8 flex items-center justify-between">
              <div>
                <h2
                  className="text-2xl text-[#2d3a2d] mb-1.5"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
                >
                  {facility.name}
                </h2>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                  {facility.category}
                </p>
              </div>

              {facility.hasData ? (
                <button
                  onClick={() => generateReport(facility, null)}
                  className="flex items-center gap-2 bg-[#4a6741] text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-[#2d3a2d] transition-all duration-300"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download Report
                </button>
              ) : (
                <span className="text-xs text-slate-300 uppercase tracking-widest font-semibold">
                  No Data Yet
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
      <Footer />
    </div>
  );
}