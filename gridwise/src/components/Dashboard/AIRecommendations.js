"use client";
import { facilityConfig } from "@/lib/facilityConfig";

export default function AIRecommendations({ data = null, facilityId = "hospital" }) {
  const config = facilityConfig[facilityId];

  if (!config.hasData || !data?.recommendations) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[160px]">
      <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">recommend</span>
      <p className="text-slate-300 font-medium">Upload data to see recommendations</p>
    </div>
  );

  const priorityColor = (p) =>
    p === "High" ? "text-red-600 border-red-200" : p === "Medium" ? "text-yellow-600 border-yellow-200" : "text-green-600 border-green-200";

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-black">AI Operational Recommendations</h3>
      <div className="space-y-4">
        {data.recommendations.map((rec, index) => (
          <div key={index} className="border rounded-xl p-3 md:p-4">
            <div className="flex flex-wrap justify-between items-start gap-1 mb-2">
              <h4 className="font-semibold text-black text-sm md:text-base">{rec.title}</h4>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${priorityColor(rec.priority)}`}>{rec.priority}</span>
            </div>
            <p className="text-sm text-gray-700">{rec.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
