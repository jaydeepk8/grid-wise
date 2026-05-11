"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { facilityConfig } from "@/lib/facilityConfig";
import { ChartSkeleton } from "@/components/Dashboard/Skeleton";

export default function ForecastChart({ facilityId = "hospital" }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const config = facilityConfig[facilityId];

  useEffect(() => {
    setLoading(true);
    setData(null);
    if (!config?.hasData) { setLoading(false); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datetime: new Date().toISOString(),
        facility_type: config.facilityType,
      }),
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [facilityId]);

  if (loading) return <ChartSkeleton />;

  if (!data?.forecast_labels) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center h-[320px]">
      <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">timeline</span>
      <p className="text-slate-300 font-medium">Forecast unavailable</p>
    </div>
  );

  const chartData = data.forecast_labels.map((label, i) => ({
    time: label,
    demand: data.forecast_values[i],
  }));

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">24-Hour Forecast</h3>
          <p className="text-xs text-slate-400 mt-0.5">AI-predicted energy demand for next 24 hours</p>
        </div>
        <div className="flex gap-3">
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

      {/* Chart */}
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4a6741" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4a6741" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={3} />
            <YAxis tick={{ fontSize: 10 }} width={45} />
            <Tooltip
              formatter={(v) => [`${v} kW`, "Predicted Demand"]}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
            />
            <ReferenceLine
              y={data.avg_predicted}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ value: "Avg", position: "right", fontSize: 10, fill: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="demand"
              stroke="#4a6741"
              strokeWidth={2.5}
              fill="url(#forecastGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#4a6741" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
