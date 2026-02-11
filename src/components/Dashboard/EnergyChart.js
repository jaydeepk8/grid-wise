"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Label
} from "recharts";

export default function EnergyChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
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

        const result = await res.json();
        const chart = result.chart;

        const chartData = chart.labels.map((label, index) => ({
          time: label,
          actual: chart.actual[index],
          predicted: chart.predicted[index],
        }));

        setData(chartData);
      } catch (error) {
        console.error("Chart fetch error:", error);
      }
    }

    fetchData();
  }, []);

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="time">
            <Label
              value="Time (Hours)"
              offset={-10}
              position="insideBottom"
            />
          </XAxis>

          <YAxis>
            <Label
              value="Energy Consumption (kW)"
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
            />
          </YAxis>

          <Tooltip />

          <Legend verticalAlign="top" height={36} />

          <Line
            type="monotone"
            dataKey="actual"
            name="Actual Consumption"
            stroke="#2E7D32"
            strokeWidth={3}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="predicted"
            name="Predicted Consumption"
            stroke="#1976D2"
            strokeDasharray="6 4"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
