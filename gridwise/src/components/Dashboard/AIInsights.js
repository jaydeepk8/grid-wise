"use client";
import { facilityConfig } from "@/lib/facilityConfig";

export default function AIInsights({ data = null, facilityId = "hospital" }) {
  const config = facilityConfig[facilityId];

  if (!config.hasData) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">lightbulb</span>
      <p className="text-slate-400 font-medium">No insights yet</p>
    </div>
  );

  if (!data?.insights) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
      <h3 className="text-lg font-semibold mb-4 text-black">AI Insights</h3>
      <ul className="space-y-3 text-black font-normal text-sm">
        {data.insights.map((point, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-green-600 font-bold shrink-0">•</span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
