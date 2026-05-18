"use client";

import { useEffect, useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { facilityConfig } from "@/lib/facilityConfig";
import { ChartSkeleton } from "@/components/Dashboard/Skeleton";

const TABS = [
  { label: "12 Hours", hours: 12 },
  { label: "24 Hours", hours: 24 },
  { label: "7 Days",   hours: 168 },
];

export default function ForecastChart({ facilityId = "hospital", active = false }) {
  const [activeTab, setActiveTab] = useState(1); // default 24h
  const [data, setData]           = useState({});
  const [loading, setLoading]     = useState(false);
  const config = facilityConfig[facilityId];

  const fetchForecast = useCallback((hours) => {
    if (!config?.hasData) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datetime: new Date().toISOString(), facility_type: config.facilityType, hours }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.forecast_labels) setData((prev) => ({ ...prev, [hours]: d })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [config]);

  useEffect(() => {
    if (!active) return;
    // Fetch all 3 on activation
    TABS.forEach((t) => fetchForecast(t.hours));
  }, [active, fetchForecast]);

  if (!active) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center h-[320px]">
      <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">timeline</span>
      <p className="text-slate-300 font-medium">Upload data to see forecast</p>
    </div>
  );

  const currentHours = TABS[activeTab].hours;
  const forecast = data[currentHours];

  // For 7-day view, show daily labels instead of hourly
  const chartData = forecast?.forecast_labels.map((label, i) => ({
    time: currentHours === 168 ? (i % 24 === 0 ? `Day ${Math.floor(i / 24) + 1}` : "") : label,
    demand: forecast.forecast_values[i],
  })) || [];

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Energy Demand Forecast</h3>
          <p className="text-xs text-slate-400 mt-0.5">AI-predicted demand using XGBoost iterative forecasting</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                activeTab === i ? "bg-white text-[#4a6741] shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI badges */}
      {forecast && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="bg-[#eef3ec] rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-slate-400">Peak Hour</p>
            <p className="text-sm font-bold text-[#4a6741]">{forecast.peak_hour}</p>
          </div>
          <div className="bg-[#eef3ec] rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-slate-400">Peak Demand</p>
            <p className="text-sm font-bold text-[#4a6741]">{forecast.peak_value} kW</p>
          </div>
          <div className="bg-[#eef3ec] rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-slate-400">Avg Demand</p>
            <p className="text-sm font-bold text-[#4a6741]">{forecast.avg_predicted} kW</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height: 260 }}>
        {loading && !forecast ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4a6741" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4a6741" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={currentHours === 168 ? 23 : currentHours === 24 ? 3 : 1} />
              <YAxis tick={{ fontSize: 10 }} width={45} />
              <Tooltip
                formatter={(v) => [`${v} kW`, "Predicted"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              {forecast && (
                <ReferenceLine y={forecast.avg_predicted} stroke="#94a3b8" strokeDasharray="4 4"
                  label={{ value: "Avg", position: "right", fontSize: 10, fill: "#94a3b8" }} />
              )}
              <Area type="monotone" dataKey="demand" stroke="#4a6741" strokeWidth={2.5}
                fill="url(#fcGrad)" dot={false} activeDot={{ r: 4, fill: "#4a6741" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {currentHours === 168 && (
        <p className="text-xs text-slate-300 mt-3 text-center">
          7-day forecast uses iterative prediction -- accuracy decreases over longer horizons
        </p>
      )}
    </div>
  );
}