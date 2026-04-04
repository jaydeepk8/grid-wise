"use client";

import { useEffect, useState } from "react";
import { facilityConfig } from "@/lib/facilityConfig";

export default function ModelAccuracy({ facilityId = "hospital" }) {
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    }
    fetchAccuracy();
  }, [facilityId]);

  const getR2Color = (r2) => {
    if (r2 >= 0.9) return "text-[#4a6741]";
    if (r2 >= 0.75) return "text-yellow-600";
    return "text-red-500";
  };

  const getR2Label = (r2) => {
    if (r2 >= 0.9) return "Excellent";
    if (r2 >= 0.75) return "Good";
    return "Fair";
  };

  const metrics = accuracy ? [
    {
      label: "Model Accuracy (R²)",
      value: loading ? "—" : `${accuracy.accuracy_percent}%`,
      sub: loading ? "" : getR2Label(accuracy.r2),
      color: loading ? "text-gray-300" : getR2Color(accuracy.r2),
      icon: "analytics",
      tooltip: "R² score × 100. Shows how well the model explains variance in energy data.",
    },
    {
      label: "Mean Abs. Error",
      value: loading ? "—" : `${accuracy.mae} kWh`,
      sub: "avg prediction error",
      color: "text-[#2d3a2d]",
      icon: "straighten",
      tooltip: "Average absolute difference between predicted and actual values.",
    },
    {
      label: "RMSE",
      value: loading ? "—" : `${accuracy.rmse} kWh`,
      sub: "root mean sq. error",
      color: "text-[#2d3a2d]",
      icon: "show_chart",
      tooltip: "Penalizes larger errors more than MAE.",
    },
    {
      label: "Algorithm",
      value: "Random Forest",
      sub: "200 decision trees",
      color: "text-[#2d3a2d]",
      icon: "account_tree",
      tooltip: "Ensemble of 200 decision trees trained on 8,760 hourly readings.",
    },
  ] : [];

  return (
    <div className="bg-white rounded-2xl px-8 py-6 shadow-sm mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-[#4a6741]/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[#4a6741] text-lg">model_training</span>
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#2d3a2d]">Model Performance</h3>
          <p className="text-xs text-slate-400">Evaluated on 20% held-out test data</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-[#f9fbf9] rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-slate-200 rounded mb-2 w-3/4" />
              <div className="h-6 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map(({ label, value, sub, color, icon }) => (
            <div key={label} className="bg-[#f9fbf9] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-slate-400 text-sm">{icon}</span>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{label}</p>
              </div>
              <p className={`text-xl font-semibold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}