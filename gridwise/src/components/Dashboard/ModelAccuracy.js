"use client";

import { useEffect, useState } from "react";
import { facilityConfig } from "@/lib/facilityConfig";

export default function ModelAccuracy({ facilityId = "hospital" }) {
  const [accuracy, setAccuracy] = useState(null);
  const config = facilityConfig[facilityId];

  useEffect(() => {
    async function fetchAccuracy() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/accuracy/${config.facilityType}`
        );
        const data = await res.json();
        setAccuracy(data);
      } catch (err) {
        console.error("Accuracy fetch error:", err);
      }
    }
    fetchAccuracy();
  }, [facilityId]);

  if (!accuracy) return null;

  const getColor = (r2) => {
    if (r2 >= 0.9) return "text-[#4a6741]";
    if (r2 >= 0.75) return "text-yellow-600";
    return "text-red-500";
  };

  const getLabel = (r2) => {
    if (r2 >= 0.9) return "Excellent";
    if (r2 >= 0.75) return "Good";
    return "Fair";
  };

  return (
    <div className="bg-white rounded-2xl px-8 py-5 shadow-sm mb-10 flex items-center gap-6">
      <div className="w-10 h-10 bg-[#4a6741]/10 rounded-xl flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[#4a6741] text-lg">model_training</span>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Model Accuracy</p>
        <p className="text-xs text-slate-400">Evaluated on 20% held-out test data</p>
      </div>
      <div className="ml-auto text-right">
        <p className={`text-3xl font-bold ${getColor(accuracy.r2)}`}>
          {accuracy.accuracy_percent}%
        </p>
        <p className={`text-xs font-medium ${getColor(accuracy.r2)}`}>
          {getLabel(accuracy.r2)}
        </p>
      </div>
    </div>
  );
}