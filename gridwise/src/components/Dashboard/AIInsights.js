"use client";

import { useEffect, useState } from "react";
import { facilityConfig } from "@/lib/facilityConfig";

export default function AIInsights({ facilityId = "hospital", uploadedData = null, isReset = false }) {
  const [insights, setInsights] = useState([]);
  const config = facilityConfig[facilityId];

  if (!config.hasData) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">lightbulb</span>
      <p className="text-slate-400 font-medium">No insights yet</p>
    </div>
  );

  useEffect(() => {
    if (uploadedData) { setInsights(uploadedData.insights || []); return; }
    async function fetchInsights() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ datetime: new Date().toISOString() }),
        });
        const result = await res.json();
        setInsights(result.insights || []);
      } catch (error) {
        console.error("AIInsights fetch error:", error);
      }
    }
    fetchInsights();
  }, [facilityId, !!uploadedData]);

  if (isReset) return (
  <div className="bg-white rounded-2xl p-8 shadow-sm col-span-4 flex flex-col items-center justify-center text-center min-h-[120px]">
    <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">upload_file</span>
    <p className="text-slate-400 font-medium">Upload data to see predictions</p>
  </div>
);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
      <h3 className="text-lg font-semibold mb-4 text-black">AI Insights</h3>
      <ul className="space-y-3 text-black font-normal text-sm">
        {insights.length === 0 ? (
          <li className="text-slate-400">Loading insights...</li>
        ) : (
          insights.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2 text-green-600 font-bold">•</span>
              {point}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}