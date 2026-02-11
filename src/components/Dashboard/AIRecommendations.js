"use client";

import { useEffect, useState } from "react";

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    async function fetchData() {
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
      setRecommendations(result.recommendations || []);
    }

    fetchData();
  }, []);

  const priorityColor = (priority) => {
    if (priority === "High") return "text-red-600";
    if (priority === "Medium") return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-black">
        AI Operational Recommendations
      </h3>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-black">{rec.title}</h4>
              <span className={`font-bold ${priorityColor(rec.priority)}`}>
                {rec.priority}
              </span>
            </div>
            <p className="text-sm text-gray-700">{rec.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
