"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";
import KPI from "@/components/Dashboard/KPI";
import EnergyChart from "@/components/Dashboard/EnergyChart";
import AIInsights from "@/components/Dashboard/AIInsights";
import AIRecommendations from "@/components/Dashboard/AIRecommendations";
import FileUpload from "@/components/FileUpload";
import { facilityConfig } from "@/lib/facilityConfig";
import { generateReport } from "@/lib/generateReport";

export default function FacilityDetailPage() {
  const { id } = useParams();
  const facility = facilityConfig[id];
  const [uploadedData, setUploadedData] = useState(null);

  if (!facility) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-32 text-center px-6">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
        <h1 className="text-2xl font-serif text-[#2d3a2d] mb-2">Facility not found</h1>
        <p className="text-slate-500 mb-6">The facility "{id}" does not exist.</p>
        <Link href="/facility" className="bg-[#4a6741] text-white px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition">
          Back to Facilities
        </Link>
      </div>
    );
  }

  const reportFacility = { name: facility.name, category: facility.category, status: facility.status };

  return (
    <div className="bg-[#f1f4f1] min-h-screen pt-32">
      <div className="max-w-7xl mx-auto px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link href="/" className="hover:text-[#4a6741] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/facility" className="hover:text-[#4a6741] transition-colors">Facilities</Link>
          <span>/</span>
          <span className="text-[#4a6741] font-medium">{facility.name}</span>
        </div>

        {/* Header */}
        <div className="bg-[#eef3ec] rounded-3xl px-10 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#4a6741]/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[#4a6741] text-3xl">{facility.icon}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{facility.category}</p>
              <h1 className="text-3xl font-serif text-[#2d3a2d]">{facility.name}</h1>
              <p className="text-slate-500 text-sm mt-1 max-w-lg">{facility.description}</p>
            </div>
          </div>

          {/* Right side — upload button only */}
          <div className="flex items-center gap-3">
            {facility.hasData && (
              <FileUpload onDataLoaded={(data) => setUploadedData(data)} />
            )}
          </div>
        </div>

        {/* Uploaded data banner */}
        {uploadedData && (
          <div className="bg-[#4a6741] rounded-2xl px-6 py-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-sm">check_circle</span>
              <p className="text-white text-sm font-medium">
                Showing predictions from your uploaded data ({uploadedData.total_rows} rows)
              </p>
            </div>
            <button
              onClick={() => setUploadedData(null)}
              className="text-white/70 hover:text-white text-xs underline transition"
            >
              Reset to default
            </button>
          </div>
        )}

        {/* KPI */}
        <section className="mb-10">
          <KPI facilityId={id} uploadedData={uploadedData} />
        </section>

        {/* Chart + Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2">
            <EnergyChart facilityId={id} uploadedData={uploadedData} />
          </div>
          <AIInsights facilityId={id} uploadedData={uploadedData} />
        </section>

        {/* Recommendations */}
        <section className="mb-10">
          <AIRecommendations facilityId={id} uploadedData={uploadedData} />
        </section>

        {/* Download Report */}
        {facility.hasData && (
          <section className="mb-16">
            <div className="bg-white rounded-2xl px-8 py-6 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-serif text-[#2d3a2d] mb-1">Energy Prediction Report</h3>
                <p className="text-sm text-slate-400">
                  {uploadedData
                    ? "Download PDF report based on your uploaded data."
                    : "Download a full PDF report with predictions, insights and recommendations."}
                </p>
              </div>
              <button
                onClick={() => generateReport(reportFacility)}
                className="flex items-center gap-2 bg-[#4a6741] text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-[#2d3a2d] transition-all duration-300 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download Report
              </button>
            </div>
          </section>
        )}

      </div>
      <Footer />
    </div>
  );
}