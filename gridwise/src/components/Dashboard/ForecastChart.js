"use client";

import { useEffect, useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { facilityConfig } from "@/lib/facilityConfig";
import { ChartSkeleton } from "@/components/Dashboard/Skeleton";

export default function ForecastChart({ facilityId = "hospital", active = false, hours = 24 }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [retries, setRetries]   = useState(0);
  const config = facilityConfig[facilityId];

  const fetchForecast = useCallback(() => {
    if (!config?.hasData) return;
    setLoading(true);
    setData(null);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datetime: new Date().toISOString(), facility_type: config.facilityType, hours }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.forecast_labels) {
          setData(d);
          setLoading(false);
        } else {
          // Retry up to 3 times with 4s delay
          setRetries((r) => {
            if (r < 3) setTimeout(() => fetchForecast(), 4000);
            else setLoading(false);
            return r + 1;
          });
        }
      })
      .catch(() => {
        setRetries((r) => {
          if (r < 3) setTimeout(() => fetchForecast(), 4000);
          else setLoading(false);
          return r + 1;
        });
      });
  }, [config, hours]);

  useEffect(() => {
    if (active) { setRetries(0); fetchForecast(); }
  }, [active, fetchForecast]);

  if (loading) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center h-[320px]">
      <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 animate-spin">autorenew</span>
      <p className="text-slate-400 font-medium text-sm">Generating forecast{retries > 0 ? ` (retry ${retries}/3)` : "..."}</p>
    </div>
  );

  if (!data) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center h-[320px]">
      <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">cloud_off</span>
      <p className="text-slate-300 font-medium">Forecast unavailable</p>
      <button onClick={() => { setRetries(0); fetchForecast(); }}
        className="mt-4 text-xs text-[#4a6741] border border-[#4a6741]/30 px-4 py-2 rounded-lg hover:bg-[#eef3ec] transition">
        Try again
      </button>
    </div>
  );

  const chartData = data.forecast_labels.map((label, i) => ({
    time: hours === 168 ? (i % 24 === 0 ? `Day ${Math.floor(i / 24) + 1}` : "") : label,
    demand: data.forecast_values[i],
  }));

  const label = hours === 12 ? "Next 12 Hours" : hours === 24 ? "Next 24 Hours" : "Next 7 Days";

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{label} Forecast</h3>
          <p className="text-xs text-slate-400 mt-0.5">XGBoost iterative energy demand prediction</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="bg-[#eef3ec] rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-slate-400">Peak Hour</p>
            <p className="text-sm font-bold text-[#4a6741]">{data.peak_hour}</p>
          </div>
          <div className="bg-[#eef3ec] rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-slate-400">Peak Demand</p>
            <p className="text-sm font-bold text-[#4a6741]">{data.peak_value} kW</p>
          </div>
          <div className="bg-[#eef3ec] rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-slate-400">Avg Demand</p>
            <p className="text-sm font-bold text-[#4a6741]">{data.avg_predicted} kW</p>
          </div>
        </div>
      </div>

      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4a6741" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4a6741" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={hours === 168 ? 23 : hours === 24 ? 3 : 1} />
            <YAxis tick={{ fontSize: 10 }} width={45} />
            <Tooltip formatter={(v) => [`${v} kW`, "Predicted"]}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
            <ReferenceLine y={data.avg_predicted} stroke="#94a3b8" strokeDasharray="4 4"
              label={{ value: "Avg", position: "right", fontSize: 10, fill: "#94a3b8" }} />
            <Area type="monotone" dataKey="demand" stroke="#4a6741" strokeWidth={2.5}
              fill="url(#fcGrad)" dot={false} activeDot={{ r: 4, fill: "#4a6741" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {hours === 168 && (
        <p className="text-xs text-slate-300 mt-3 text-center">
          7-day forecast uses iterative prediction - accuracy decreases over longer horizons
        </p>
      )}
    </div>
  );
}