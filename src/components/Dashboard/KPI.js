"use client";

import { useEffect, useState } from "react";

export default function KPI() {
const [currentDemand, setCurrentDemand] = useState(null);
const [predictedDemand, setPredictedDemand] = useState(null);
const [peakRisk, setPeakRisk] = useState(null);
const [renewableMix, setRenewableMix] = useState(null);
const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchPrediction() {
      try {
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

        const data = await res.json();

          setCurrentDemand(data.current_demand_kwh);
          setPredictedDemand(data.predicted_next_hour_kwh);
          setPeakRisk(data.peak_load_risk);
          setRenewableMix(data.renewable_mix_percent);

      } catch (error) {
        console.error("Prediction API error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPrediction();
  }, []);

  const kpis = [
  {
    title: "Current Demand",
    value: loading ? "Loading..." : `${currentDemand} kW`,
  },
  {
    title: "Predicted Demand",
    value: loading ? "Loading..." : `${predictedDemand} kW`,
  },
  {
    title: "Peak Load Risk",
    value: loading ? "Loading..." : peakRisk,
  },
  {
    title: "Renewable Mix",
    value: loading ? "Loading..." : `${renewableMix}%`,
  },
];


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            {kpi.title}
          </p>
          <h2
          className={`text-2xl font-semibold mt-2 transition-colors duration-300 ${
            kpi.title === "Predicted Demand" && loading
                ? "text-gray-300"
                : "text-gray-900"
            }`}
              >
            {kpi.value}
          </h2>

          <p className={`text-sm mt-1 ${kpi.noteColor}`}>
            {kpi.note}
          </p>
        </div>
      ))}
    </div>
  );
}
