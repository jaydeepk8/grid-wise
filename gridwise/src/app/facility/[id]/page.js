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

const TABS = [
  { label: "Next Hour", hours: 1   },
  { label: "12 Hours",  hours: 12  },
  { label: "24 Hours",  hours: 24  },
  { label: "7 Days",    hours: 168 },
];

// Convert forecast API response into the same shape the components expect
function buildForecastData(forecast, baseData) {
  if (!forecast?.forecast_labels) return null;
  const peak = forecast.peak_value ?? 0;
  return {
    ...baseData,
    current_demand_kwh:      forecast.avg_predicted,
    predicted_next_hour_kwh: peak,
    peak_demand_kwh:         peak,
    peak_load_risk:          forecast.peak_load_risk ?? (peak > 800 ? "High Risk" : peak > 600 ? "Medium Risk" : "Low Risk"),
    renewable_mix_percent:   forecast.renewable_mix_percent ?? baseData?.renewable_mix_percent ?? 0,
    chart: {
      labels:    forecast.forecast_labels,
      actual:    forecast.forecast_labels.map(() => null),
      predicted: forecast.forecast_values,
    },
    insights:        forecast.insights ?? baseData?.insights ?? [],
    recommendations: forecast.recommendations ?? baseData?.recommendations ?? [],
  };
}

function buildFallbackForecast(uploadedData, hours) {
  if (!uploadedData?.chart?.actual?.length) return null;

  const actual = uploadedData.chart.actual.filter((value) => typeof value === "number");
  const last = uploadedData.current_demand_kwh ?? actual[actual.length - 1] ?? 0;
  const previous = actual[actual.length - 2] ?? last;
  const recentAvg = actual.slice(-6).reduce((sum, value) => sum + value, 0) / Math.max(actual.slice(-6).length, 1);
  const trend = Math.max(Math.min(last - previous, last * 0.04), -last * 0.04);
  const start = uploadedData.source_datetime ? new Date(uploadedData.source_datetime) : new Date();

  let rolling = last;
  const labels = [];
  const values = [];

  for (let i = 1; i <= hours; i++) {
    const dt = new Date(start.getTime() + i * 60 * 60 * 1000);
    const hour = dt.getHours();
    const dailyWave = Math.sin(((hour - 6) / 24) * Math.PI * 2) * 0.06 * last;
    rolling = rolling * 0.72 + recentAvg * 0.2 + (last + trend * i + dailyWave) * 0.08;

    labels.push(hours > 24
      ? dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit" })
      : dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    values.push(Number(Math.max(0, rolling).toFixed(2)));
  }

  const peakValue = Math.max(...values);
  const peakIndex = values.indexOf(peakValue);
  const avgPredicted = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    facility: uploadedData.facility,
    forecast_labels: labels,
    forecast_values: values,
    peak_hour: labels[peakIndex],
    peak_value: Number(peakValue.toFixed(2)),
    avg_predicted: Number(avgPredicted.toFixed(2)),
    peak_load_risk: peakValue > avgPredicted * 1.1 ? "High Risk" : peakValue > avgPredicted * 1.05 ? "Medium Risk" : "Low Risk",
    renewable_mix_percent: uploadedData.renewable_mix_percent ?? 45,
    insights: [
      `Average predicted demand for this period is ${avgPredicted.toFixed(2)} kWh.`,
      `Peak demand is expected around ${labels[peakIndex]} at ${peakValue.toFixed(2)} kWh.`,
      `Forecast horizon covers the next ${hours} hours.`,
    ],
    recommendations: [
      {
        title: "Plan Load Scheduling Around Forecast Peak",
        priority: peakValue > avgPredicted * 1.1 ? "High" : "Medium",
        impact: `Peak demand is ${(((peakValue - avgPredicted) / avgPredicted) * 100).toFixed(2)}% above the forecast average.`,
      },
      {
        title: "Continue Preventive Monitoring",
        priority: "Low",
        impact: "Fallback forecast is based on uploaded demand trend while the forecast API is unavailable.",
      },
    ],
  };
}

export default function FacilityDetailPage() {
  const { id } = useParams();
  const facility = facilityConfig[id];
  const facilityType = facility?.facilityType;
  const facilityName = facility?.name;
  const hasFacilityData = facility?.hasData;
  const [activeTab, setActiveTab]             = useState(0);
  const [uploadedData, setUploadedData]       = useState(null);
  const [uploadedFile, setUploadedFile]       = useState(null);
  const [liveRefreshing, setLiveRefreshing]   = useState(false);
  const liveIntervalRef                       = useRef(null);
  const [forecastCache, setForecastCache]     = useState({});
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastFallback, setForecastFallback] = useState({});
  const [uploading, setUploading]             = useState(false);

  const refreshLive = useCallback(async () => {
    if (!uploadedFile || !facilityType) return;
    setLiveRefreshing(true);
    try {
      const form = new FormData();
      form.append("file", uploadedFile);
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-predict?facility_type=${facilityType}`,
        { method: "POST", body: form }
      );
      const data = await res.json();
      if (!data.error) setUploadedData(data);
    } catch {}
    finally { setLiveRefreshing(false); }
  }, [uploadedFile, facilityType]);

  useEffect(() => {
    clearInterval(liveIntervalRef.current);
    if (uploadedFile) liveIntervalRef.current = setInterval(refreshLive, 30000);
    return () => clearInterval(liveIntervalRef.current);
  }, [uploadedFile, refreshLive]);

  useEffect(() => {
    if (activeTab === 0 || !uploadedData || !facilityType) return;
    const hours = TABS[activeTab].hours;
    if (forecastCache[hours]) return;
    let attempts = 0;
    setForecastLoading(true);

    const applyFallbackForecast = () => {
      const fallback = buildFallbackForecast(uploadedData, hours);
      if (fallback) {
        setForecastCache((prev) => ({ ...prev, [hours]: fallback }));
        setForecastFallback((prev) => ({ ...prev, [hours]: true }));
      }
      setForecastLoading(false);
    };

    const tryFetch = () => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datetime: uploadedData.source_datetime || new Date().toISOString(),
          facility_type: facilityType,
          hours,
          prev_hour_energy: uploadedData.prev_hour_energy ?? uploadedData.current_demand_kwh,
          rolling_3h_avg: uploadedData.rolling_3h_avg,
          rolling_6h_avg: uploadedData.rolling_6h_avg,
        }),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (d?.forecast_labels) {
            setForecastCache((prev) => ({ ...prev, [hours]: d }));
            setForecastFallback((prev) => ({ ...prev, [hours]: false }));
            setForecastLoading(false);
          } else if (attempts < 4) {
            attempts++;
            setTimeout(tryFetch, 4000);
          } else {
            applyFallbackForecast();
          }
        })
        .catch(() => {
          if (attempts < 4) { attempts++; setTimeout(tryFetch, 4000); }
          else applyFallbackForecast();
        });
    };

    tryFetch();
  }, [activeTab, uploadedData, facilityType, forecastCache]);

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
  const isNextHour  = activeTab === 0;
  const activeHours = TABS[activeTab].hours;
  const forecast    = forecastCache[activeHours];
  const forecastData = buildForecastData(forecast, uploadedData);
  const activeData   = isNextHour ? uploadedData : (forecastData ?? uploadedData);
  const showLoading  = !isNextHour && forecastLoading && !forecast;

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

        {/* Header */}
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
              onDataLoaded={(data) => { setUploadedData(data); setActiveTab(0); setForecastCache({}); setForecastFallback({}); }}
              onFileReady={(f) => setUploadedFile(f)}
              onLoadingChange={(v) => setUploading(v)}
            />
          )}
        </div>

        {/* Uploaded data banner */}
        {uploadedData && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#4a6741] rounded-2xl px-4 md:px-6 py-4 mb-6">
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
              <button onClick={() => { setUploadedData(null); setUploadedFile(null); setActiveTab(0); setForecastCache({}); setForecastFallback({}); clearInterval(liveIntervalRef.current); }} className="text-white/70 hover:text-white text-xs underline transition">
                Reset to default
              </button>
            </div>
          </div>
        )}

        {/* Time horizon tabs - only after upload */}
        {uploadedData && facility.hasData && (
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm mb-8 w-fit">
            {TABS.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`text-sm font-semibold px-5 py-2 rounded-xl transition-all ${
                  activeTab === i ? "bg-[#4a6741] text-white shadow" : "text-slate-400 hover:text-[#4a6741]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Forecast status banner */}
        {!isNextHour && uploadedData && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-6 text-sm ${
            forecastLoading ? "bg-blue-50 text-blue-600" :
            forecastData   ? "bg-[#eef3ec] text-[#4a6741]" :
                             "bg-amber-50 text-amber-600"
          }`}>
            <span className={`material-symbols-outlined text-sm ${forecastLoading ? "animate-spin" : ""}`}>
              {forecastLoading ? "autorenew" : forecastData ? "check_circle" : "info"}
            </span>
            {forecastLoading
              ? `Generating ${TABS[activeTab].label} forecast...`
              : forecastData
              ? forecastFallback[activeHours]
                ? `Showing trend-based forecast for the next ${TABS[activeTab].label.toLowerCase()} while the API is unavailable`
                : `Showing AI-predicted energy demand for the next ${TABS[activeTab].label.toLowerCase()}`
              : "Forecast unavailable — showing last known data. Try again shortly."}
          </div>
        )}

        {/* Skeleton while uploading */}
        {uploading && !uploadedData && (
          <>
            <section className="mb-10"><KPISkeleton /></section>
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <div className="lg:col-span-2"><ChartSkeleton /></div>
              <InsightsSkeleton />
            </section>
            <section className="mb-10"><RecommendationsSkeleton /></section>
          </>
        )}

        {/* Empty state — before upload */}
        {!uploadedData && !uploading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-[#eef3ec] rounded-3xl flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[#4a6741] text-4xl">cloud_upload</span>
            </div>
            <h2 className="text-2xl font-serif text-[#2d3a2d] mb-2">Upload your energy data</h2>
            <p className="text-slate-400 text-sm max-w-sm mb-1">Upload a CSV or Excel file with <strong>datetime</strong> and <strong>energy_kwh</strong> columns to get AI-powered predictions.</p>
            <p className="text-slate-300 text-xs">Minimum 6 rows required</p>
          </div>
        )}

        {/* Dashboard — only after upload */}
        {uploadedData && (
          <>
            {/* KPI cards */}
            <section className="mb-10">
              {showLoading ? <KPISkeleton /> : <KPI data={activeData} facilityId={id} />}
            </section>

            {/* Chart + Insights */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <div className="lg:col-span-2">
                {showLoading ? <ChartSkeleton /> : <EnergyChart data={activeData} facilityId={id} />}
              </div>
              {showLoading ? <InsightsSkeleton /> : <AIInsights data={activeData} facilityId={id} />}
            </section>

            {/* Recommendations */}
            <section className="mb-10">
              {showLoading ? <RecommendationsSkeleton /> : <AIRecommendations data={activeData} facilityId={id} />}
            </section>
          </>
        )}

        {/* Download Report — only after upload */}
        {uploadedData && activeData && (
          <section className="mb-16">
            <div className="bg-white rounded-2xl px-8 py-6 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-serif text-[#2d3a2d] mb-1">Energy Prediction Report</h3>
                <p className="text-sm text-slate-400">Download PDF report based on your uploaded data.</p>
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
