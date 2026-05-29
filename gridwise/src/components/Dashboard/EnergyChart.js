"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { facilityConfig } from "@/lib/facilityConfig";

export default function EnergyChart({ data = null, facilityId = "hospital" }) {
  const config = facilityConfig[facilityId];

  if (!config.hasData || !data?.chart) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center h-[320px]">
      <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">bar_chart</span>
      <p className="text-slate-300 font-medium">Upload data to see chart</p>
    </div>
  );

  const { labels, actual, predicted } = data.chart;

  // On forecast tabs, actual is all null — hide the Actual line entirely
  const hasActual = actual && actual.some((v) => v !== null && v !== undefined);

  // Compute X-axis tick interval to avoid crowding
  // 1-12 pts: show every label, 13-48: every 2nd, 49+: every 12th
  const totalPts = labels.length;
  const xInterval = totalPts <= 12 ? 0 : totalPts <= 48 ? 1 : 11;

  const chartData = labels.map((label, i) => ({
    time: label,
    actual: actual[i] ?? null,
    predicted: predicted[i] ?? null,
  }));

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm w-full" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11 }}
            interval={xInterval}
            angle={totalPts > 24 ? -35 : 0}
            textAnchor={totalPts > 24 ? "end" : "middle"}
          />
          <YAxis tick={{ fontSize: 11 }} width={45} />
          <Tooltip />
          <Legend verticalAlign="top" height={30} />
          {hasActual && (
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#2E7D32"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          )}
          <Line
            type="monotone"
            dataKey="predicted"
            name={hasActual ? "Predicted" : "Forecast"}
            stroke="#1976D2"
            strokeDasharray={hasActual ? "6 4" : "0"}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
