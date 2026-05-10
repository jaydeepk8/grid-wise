"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { facilityConfig } from "@/lib/facilityConfig";

export default function EnergyChart({ data = null, facilityId = "hospital" }) {
  const config = facilityConfig[facilityId];

  if (!config.hasData) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center h-[320px]">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">bar_chart</span>
      <p className="text-slate-400 font-medium">No chart data available yet</p>
    </div>
  );

  if (!data?.chart) return null;

  const { labels, actual, predicted } = data.chart;
  const chartData = labels.map((label, i) => ({ time: label, actual: actual[i], predicted: predicted[i] }));

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
