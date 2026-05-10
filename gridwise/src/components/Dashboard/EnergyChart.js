"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Label } from "recharts";
import { facilityConfig } from "@/lib/facilityConfig";
import { ChartSkeleton, ErrorState } from "@/components/Dashboard/Skeleton";

export default function EnergyChart({ facilityId = "hospital", uploadedData = null, isReset = false }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const config = facilityConfig[facilityId];

  if (!config.hasData) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center h-[400px]">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">bar_chart</span>
      <p className="text-slate-400 font-medium">No chart data available yet</p>
    </div>
  );

  useEffect(() => {
    setLoading(true);
    if (isReset) { setChartData([]); setLoading(false); setLoading(false); return; }
    if (uploadedData) {
      if (!uploadedData.chart) return;
      const { labels, actual, predicted } = uploadedData.chart;
      setChartData(labels.map((label, i) => ({ time: label, actual: actual[i], predicted: predicted[i] })));
      return;
    }
    async function fetchData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            datetime: new Date().toISOString(),
            facility_type: config.facilityType,
          }),
        });
        const result = await res.json();
        const { labels, actual, predicted } = result.chart;
        setChartData(labels.map((label, i) => ({ time: label, actual: actual[i], predicted: predicted[i] })));
      } catch (err) {
        console.error("Chart fetch error:", err);
        setError(true);
      }
    }
    fetchData();
  }, [facilityId, !!uploadedData, isReset]);

  if (isReset) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center h-[400px]">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">upload_file</span>
      <p className="text-slate-400 font-medium">Upload data to see predictions</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm w-full" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={45} />
          <Tooltip />
          <Legend verticalAlign="top" height={30} />
          <Line type="monotone" dataKey="actual" name="Actual" stroke="#2E7D32" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#1976D2" strokeDasharray="6 4" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
