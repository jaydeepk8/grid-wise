"use client";
import { facilityConfig } from "@/lib/facilityConfig";

const NO_DATA_PLACEHOLDER = (name) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm col-span-4 flex flex-col items-center justify-center text-center min-h-[120px]">
    <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">hourglass_empty</span>
    <p className="text-slate-400 font-medium">No data available yet</p>
    <p className="text-slate-300 text-sm mt-1">Data for {name} will appear here once connected.</p>
  </div>
);

export default function KPI({ data = null, facilityId = "hospital" }) {
  const config = facilityConfig[facilityId];
  if (!config.hasData) return NO_DATA_PLACEHOLDER(config.name);
  if (!data) return null;

  const kpis = [
    { title: "Current Demand",   value: `${data.current_demand_kwh} kW` },
    { title: "Predicted Demand", value: `${data.predicted_next_hour_kwh} kW` },
    { title: "Peak Load Risk",   value: data.peak_load_risk },
    { title: "Renewable Mix",    value: `${data.renewable_mix_percent}%` },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">{kpi.title}</p>
          <h2 className="text-2xl font-semibold mt-2 text-gray-900">{kpi.value}</h2>
        </div>
      ))}
    </div>
  );
}
