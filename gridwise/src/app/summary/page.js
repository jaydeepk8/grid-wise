"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

const facilities = [
  {
    id: "hospital",
    name: "General Hospital",
    category: "Essential Service",
    icon: "local_hospital",
    description: "Real-time energy monitoring and AI demand prediction for hospitals.",
  },
  {
    id: "data-center",
    name: "Data Center",
    category: "Critical Infrastructure",
    icon: "dns",
    description: "High-uptime energy forecasting for data center operations.",
  },
  {
    id: "mnc",
    name: "MNC Office",
    category: "Corporate Excellence",
    icon: "business",
    description: "Sustainability-focused energy predictions for large corporate facilities.",
  },
];

export default function SummaryPage() {
  return (
    <div className="bg-[#f1f4f1] min-h-screen flex flex-col pt-32">
      <div className="max-w-5xl mx-auto px-6 w-full flex-1">

        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold mb-3">Overview</p>
          <h1
            className="text-5xl text-[#2d3a2d] mb-4"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
          >
            Facility Summary
          </h1>
          <p className="text-slate-400 text-sm max-w-lg">
            Upload your energy data on any facility page to generate AI predictions, forecasts, and a downloadable PDF report.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-16">
          {facilities.map((facility) => (
            <div key={facility.id} className="bg-white rounded-2xl px-8 md:px-10 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-[#4a6741]/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#4a6741] text-2xl">{facility.icon}</span>
                </div>
                <div>
                  <h2
                    className="text-xl text-[#2d3a2d] mb-0.5"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
                  >
                    {facility.name}
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">{facility.category}</p>
                  <p className="text-slate-400 text-xs">{facility.description}</p>
                </div>
              </div>

              <Link
                href={`/facility/${facility.id}`}
                className="flex items-center gap-2 bg-[#4a6741] text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-[#2d3a2d] transition-all duration-300 whitespace-nowrap w-fit"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                View & Download
              </Link>
            </div>
          ))}
        </div>

        {/* Info note */}
        <div className="flex items-start gap-3 bg-white rounded-2xl px-6 py-5 mb-16 shadow-sm">
          <span className="material-symbols-outlined text-[#4a6741] text-xl mt-0.5">info</span>
          <div>
            <p className="text-sm font-medium text-[#2d3a2d] mb-1">How to generate a report</p>
            <p className="text-sm text-slate-400">
              Open a facility, upload a CSV with <code className="bg-slate-100 px-1 rounded text-xs">datetime</code> and{" "}
              <code className="bg-slate-100 px-1 rounded text-xs">energy_kwh</code> columns, run the prediction, then click <strong>Download Report</strong>.
              The PDF will include Next Hour, 12h, 24h and 7-day forecasts if those tabs were loaded.
            </p>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}