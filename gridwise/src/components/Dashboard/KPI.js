"use client";

import { useEffect, useState } from "react";
import { facilityConfig } from "@/lib/facilityConfig";

const NO_DATA_PLACEHOLDER = (name) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm col-span-4 flex flex-col items-center justify-center text-center min-h-[120px]">
    <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">hourglass_empty</span>
    <p className="text-slate-400 font-medium">No data available yet</p>
    <p className="text-slate-300 text-sm mt-1">Data for {name} will appear here once connected.</p>
  </div>
);

export default function KPI({ facilityId = "hospital", uploadedData = null, isReset = false }) {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const config = facilityConfig[facilityId];

  if (!config.hasData) return NO_DATA_PLACEHOLDER(config.name);

  useEffect(() => {
    if (uploadedData) { setLoading(false); return; }
    if (isReset) { setLoading(false); return; }
    async function fetchPrediction() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            datetime: new Date().toISOString(),
            facility_type: config.facilityType,
          }),
        });
        const data = await res.json();
        setApiData(data);
      } catch (error) {
        console.error("Prediction API error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrediction();
  }, [facilityId, !!uploadedData, isReset]);

  if (isReset) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm col-span-4 flex flex-col items-center justify-center text-center min-h-[120px]">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">upload_file</span>
      <p className="text-slate-400 font-medium">Upload data to see predictions</p>
    </div>
  );

  const source = uploadedData || apiData;

  const kpis = [
    { title: "Current Demand",   value: loading ? "Loading..." : `${source?.current_demand_kwh} kW` },
    { title: "Predicted Demand", value: loading ? "Loading..." : `${source?.predicted_next_hour_kwh} kW` },
    { title: "Peak Load Risk",   value: loading ? "Loading..." : source?.peak_load_risk },
    { title: "Renewable Mix",    value: loading ? "Loading..." : `${source?.renewable_mix_percent}%` },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">{kpi.title}</p>
          <h2 className={`text-2xl font-semibold mt-2 transition-colors duration-300 ${loading ? "text-gray-300" : "text-gray-900"}`}>
            {kpi.value}
          </h2>
        </div>
      ))}
    </div>
  );
}