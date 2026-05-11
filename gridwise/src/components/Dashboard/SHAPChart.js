"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { facilityConfig } from "@/lib/facilityConfig";

export default function SHAPChart({ facilityId = "hospital" }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const config = facilityConfig[facilityId];

  useEffect(() => {
    setLoading(true); setData(null);
    if (!config?.hasData) { setLoading(false); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datetime: new Date().toISOString(),
        facility_type: config.facilityType,
      }),
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [facilityId]);

  if (loading) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="h-4 w-40 bg-slate-200 rounded mb-6" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-3 mb-3 items-center">
          <div className="h-3 w-36 bg-slate-200 rounded" />
          <div className="h-5 bg-slate-200 rounded flex-1" style={{ maxWidth: `${(6 - i) * 14}%` }} />
        </div>
      ))}
    </div>
  );

  if (!data?.importance) return null;

  const chartData = data.importance.map((d) => ({
    name: d.feature,
    value: d.abs_value,
    raw: d.shap_value,
  }));

  const max = Math.max(...chartData.map((d) => d.value)) || 1;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Why this prediction?</h3>
          <p className="text-xs text-slate-400 mt-0.5">SHAP values — how much each feature influenced the model</p>
        </div>
        <div className="bg-[#eef3ec] rounded-xl px-3 py-2 text-center">
          <p className="text-xs text-slate-400">Prediction</p>
          <p className="text-sm font-bold text-[#4a6741]">{data.prediction} kW</p>
        </div>
      </div>

      {/* Horizontal bar chart */}
      <div className="mt-5 space-y-3">
        {chartData.map((item, i) => {
          const width = Math.round((item.value / max) * 100);
          const isPositive = item.raw >= 0;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-40 shrink-0 text-right">{item.name}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${width}%`,
                    backgroundColor: isPositive ? "#4a6741" : "#e57373",
                  }}
                />
              </div>
              <span className={`text-xs font-semibold w-14 shrink-0 ${isPositive ? "text-[#4a6741]" : "text-red-500"}`}>
                {item.raw > 0 ? "+" : ""}{item.raw.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-300 mt-4">
        Green = pushes prediction up &nbsp;|&nbsp; Red = pushes prediction down &nbsp;|&nbsp; Base value: {data.base_value} kW
      </p>
    </div>
  );
}
