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
  }, [config.facilityType]);

  if (!accuracy) return null;

  const getLabel = (r2) => r2 >= 0.9 ? "Excellent" : r2 >= 0.75 ? "Good" : "Fair";

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/15 text-white">
      <span className="material-symbols-outlined text-base">model_training</span>
      <span className="font-bold">{accuracy.accuracy_percent}%</span>
      <span className="text-xs text-white/70">{getLabel(accuracy.r2)}</span>
    </div>
  );
}
