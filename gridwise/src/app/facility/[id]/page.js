"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import Footer from "@/components/Footer";
import KPI from "@/components/Dashboard/KPI";
import EnergyChart from "@/components/Dashboard/EnergyChart";
import AIInsights from "@/components/Dashboard/AIInsights";
import AIRecommendations from "@/components/Dashboard/AIRecommendations";
import ModelAccuracy from "@/components/Dashboard/ModelAccuracy";
import FileUpload from "@/components/FileUpload";
import { facilityConfig } from "@/lib/facilityConfig";
import { generateReport } from "@/lib/generateReport";
import { KPISkeleton, ChartSkeleton, InsightsSkeleton, RecommendationsSkeleton } from "@/components/Dashboard/Skeleton";

export default function FacilityDetailPage() {
  const { id } = useParams();
  const facility = facilityConfig[id];
  const [uploadedData, setUploadedData] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [liveRefreshing, setLiveRefreshing] = useState(false);
  const liveIntervalRef = useRef(null);
  const [defaultData, setDefaultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!facility?.hasData) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datetime: new Date().toISOString(), facility_type: facility.facilityType }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.current_demand_kwh) { setDefaultData(data); document.title = `${facility.name} | GridWise`; } })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const refreshLive = useCallback(async () => {
    if (!uploadedFile || !facility?.facilityType) return;
    setLiveRefreshing(true);
    try {
      const form = new FormData();
      form.append("file", uploadedFile);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-predict?facility_type=${facility.facilityType}`,
        { method: "POST", body: form }
      );
      const data = await res.json();
      if (!data.error) setUploadedData(data);
    } catch {}
    finally { setLiveRefreshing(false); }
  }, [uploadedFile, facility]);

  useEffect(() => {
    clearInterval(liveIntervalRef.current);
    if (uploadedFile) {
      liveIntervalRef.current = setInterval(refreshLive, 30000);
    }
    return () => clearInterval(liveIntervalRef.current);
  }, [uploadedFile, refreshLive]);

  if (!facility) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-32 text-center px-6">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
        <h1 className="text-2xl font-serif text-[#2d3a2d] mb-2">Facility not found</h1>
        <p className="text-slate-500 mb-6">The facility does not exist.</p>
        <Link href="/facility" className="bg-[#4a6741] text-white px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition">
          Back to Facilities
        </Link>
      </div>
    );
  }

  const reportFacility = { name: facility.name, category: facility.category, status: facility.status, facilityType: facility.facilityType };
  const activeData = uploadedData || defaultData;

  return (
    <div className="bg-[#f1f4f1] min-h-screen pt-32">
      <div className="max-w-7xl mx-auto px-3 md:px-6">

        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link href="/" className="hover:text-[#4a6741] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/facility" className="hover:text-[#4a6741] transition-colors">Facilities</Link>
          <span>/</span>
          <span className="text-[#4a6741] font-medium">{facility.name}</span>
        </div>

        <div className="bg-[#eef3ec] rounded-3xl px-4 md:px-10 py-6 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8 mb-6">
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
          {facility.hasData && (
            <FileUpload
              facilityType={facility.facilityType}
              onDataLoaded={(data) => { setUploadedData(data); }}
              onFileReady={(f) => setUploadedFile(f)}
            />
          )}
        </div>

        {uploadedData && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#4a6741] rounded-2xl px-4 md:px-6 py-4 mb-10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-sm">check_circle</span>
              <p className="text-white text-sm font-medium">Showing predictions from your uploaded data ({uploadedData.total_rows} rows)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-white/80">
                <span className={`w-2 h-2 rounded-full bg-white ${liveRefreshing ? "animate-ping" : "animate-pulse"}`} />
                {liveRefreshing ? "Refreshing..." : "Live - updates every 30s"}
              </div>
              <ModelAccuracy facilityId={id} />
              <button onClick={() => { setUploadedData(null); setUploadedFile(null); clearInterval(liveIntervalRef.current); }} className="text-white/70 hover:text-white text-xs underline transition">
                Reset to default
              </button>
            </div>
          </div>
        )}

        <section className="mb-10">
          {loading ? <KPISkeleton /> : <KPI data={activeData} facilityId={id} />}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2">
            {loading ? <ChartSkeleton /> : <EnergyChart data={activeData} facilityId={id} />}
          </div>
          {loading ? <InsightsSkeleton /> : <AIInsights data={activeData} facilityId={id} />}
        </section>

        <section className="mb-10">
          {loading ? <RecommendationsSkeleton /> : <AIRecommendations data={activeData} facilityId={id} />}
        </section>

        {facility.hasData && activeData && (
          <section className="mb-16">
            <div className="bg-white rounded-2xl px-8 py-6 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-serif text-[#2d3a2d] mb-1">Energy Prediction Report</h3>
                <p className="text-sm text-slate-400">
                  {uploadedData ? "Download PDF report based on your uploaded data." : "Download a full PDF report with predictions, insights and recommendations."}
                </p>
              </div>
              <button
                onClick={() => generateReport(reportFacility, activeData)}
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