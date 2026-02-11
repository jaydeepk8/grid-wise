"use client";

import { useEffect, useState } from "react";

export default function AIInsights() {
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    async function fetchInsights() {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          datetime: new Date().toISOString(),
          prev_hour_energy: 452.5,
          rolling_3h_avg: 460.2,
          rolling_6h_avg: 445.8,
        }),
      });

      const result = await res.json();
      setInsights(result.insights);
    }

    fetchInsights();
  }, []);

  return (
  <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
    <h3 className="text-lg font-semibold mb-4 text-black">
      AI Insights
    </h3>

    <ul className="space-y-3 text-black font-normal text-sm">
      {insights.map((point, index) => (
        <li key={index} className="flex items-start">
          <span className="mr-2 text-green-600 font-bold">•</span>
          {point}
        </li>
      ))}
    </ul>
  </div>
);
}
