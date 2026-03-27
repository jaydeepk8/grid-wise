"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Label } from "recharts";
import { facilityConfig } from "@/lib/facilityConfig";

export default function EnergyChart({ facilityId = "hospital" }) {
  const [data, setData] = useState([]);
  const config = facilityConfig[facilityId];

  if (!config.hasData) return (
    <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center h-[400px]">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">bar_chart</span>
      <p className="text-slate-400 font-medium">No chart data available yet</p>
      <p className="text-slate-300 text-sm mt-1">Data for {config.name} will appear here once connected.</p>
    </div>
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        
          body: JSON.stringify({ datetime: new Date().toISOString() }),
        });

        const result = await res.json();
        const chart = result.chart;

        const chartData = chart.labels.map((label, index) => ({
          time: label,
          actual: chart.actual[index],
          predicted: chart.predicted[index],
        }));

        setData(chartData);
      } catch (error) {
        console.error("Chart fetch error:", error);
      }
    }
    fetchData();
  }, [facilityId]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time">
            <Label value="Time (Hours)" offset={-10} position="insideBottom" />
          </XAxis>
          <YAxis>
            <Label value="Energy (kWh)" angle={-90} position="insideLeft" style={{ textAnchor: "middle" }} />
          </YAxis>
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <Line type="monotone" dataKey="actual" name="Actual" stroke="#2E7D32" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#1976D2" strokeDasharray="6 4" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}