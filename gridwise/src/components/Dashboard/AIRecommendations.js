"use client";

import { useEffect, useState } from "react";
import { facilityConfig } from "@/lib/facilityConfig";

export default function AIRecommendations({ facilityId = "hospital", uploadedData = null, isReset = false }) {
  const [recommendations, setRecommendations] = useState([]);
  const config = facilityConfig[facilityId];

  if (!config.hasData) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[160px]">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">recommend</span>
      <p className="text-slate-400 font-medium">No recommendations yet</p>
    </div>
  );

  
  useEffect(() => {
    if (uploadedData) { setRecommendations(uploadedData.recommendations || []); return; }
    async function fetchData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ datetime: new Date().toISOString() }),
        });
        const result = await res.json();
        setRecommendations(result.recommendations || []);
      } catch (error) {
        console.error("AIRecommendations fetch error:", error);
      }
    }
    fetchData();
  }, [facilityId, !!uploadedData]);

  if (isReset) return (
  <div className="bg-white rounded-2xl p-8 shadow-sm col-span-4 flex flex-col items-center justify-center text-center min-h-[120px]">
    <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">upload_file</span>
    <p className="text-slate-400 font-medium">Upload data to see predictions</p>
  </div>
);


  const priorityColor = (priority) => {
    if (priority === "High") return "text-red-600";
    if (priority === "Medium") return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-black">AI Operational Recommendations</h3>
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <p className="text-slate-400 text-sm">Loading recommendations...</p>
        ) : (
          recommendations.map((rec, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-black">{rec.title}</h4>
                <span className={`font-bold ${priorityColor(rec.priority)}`}>{rec.priority}</span>
              </div>
              <p className="text-sm text-gray-700">{rec.impact}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}