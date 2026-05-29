"use client";
import { facilityConfig } from "@/lib/facilityConfig";

export default function KPI({ data = null, facilityId = "hospital", isForecasting = false }) {
  const config = facilityConfig[facilityId];

  if (!config.hasData) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm col-span-4 flex flex-col items-center justify-center text-center min-h-[120px]">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">hourglass_empty</span>
      <p className="text-slate-400 font-medium">No data available for {config.name}</p>
    </div>
  );

  const kpis = [
    { title: isForecasting ? "Avg Demand"  : "Current Demand",   value: data ? `${data.current_demand_kwh} kW`      : null },
    { title: isForecasting ? "Peak Demand" : "Predicted Demand", value: data ? `${data.predicted_next_hour_kwh} kW` : null },
    { title: "Peak Load Risk",   value: data ? data.peak_load_risk             : null },
    { title: "Renewable Mix",    value: data ? `${data.renewable_mix_percent}%` : null },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">{kpi.title}</p>
          {kpi.value
            ? <h2 className="text-2xl font-semibold mt-2 text-gray-900">{kpi.value}</h2>
            : <div className="mt-3 h-7 w-20 bg-slate-100 rounded-lg" />
          }
        </div>
      ))}
    </div>
  );
}
