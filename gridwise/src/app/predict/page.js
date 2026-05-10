"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

const facilityOptions = ["Hospital", "Data Center", "MNC"];

export default function PredictPage() {
  const [form, setForm] = useState({
    facility_type: "Hospital",
    current_load: "",
    hour: new Date().getHours(),
    day_of_week: new Date().getDay(),
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handlePredict() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          current_load: parseFloat(form.current_load),
          hour: parseInt(form.hour),
          day_of_week: parseInt(form.day_of_week),
        }),
      });

      if (!res.ok) throw new Error("Prediction failed. Check the API.");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#f1f4f1] min-h-screen flex flex-col pt-32">
      <div className="max-w-2xl mx-auto px-6 w-full flex-1">

        
        <div className="bg-[#eef3ec] rounded-3xl px-10 py-8 mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-[#4a6741]/15 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[#4a6741] text-2xl">
                bolt
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-serif text-[#2d3a2d]">
                Energy Prediction
              </h1>
              <p className="text-slate-500 text-sm">
                Predict next-hour energy load using the Random Forest model
              </p>
            </div>
          </div>
        </div>

        
        <div className="bg-white rounded-2xl px-8 py-8 shadow-sm mb-6">
          <h2 className="text-lg font-serif text-[#2d3a2d] mb-6">
            Input Parameters
          </h2>

          <div className="space-y-5">

            
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
                Facility Type
              </label>
              <select
                name="facility_type"
                value={form.facility_type}
                onChange={handleChange}
                className="w-full border border-[#4a6741]/20 rounded-xl px-4 py-3 text-sm text-[#2d3a2d] bg-[#f9fbf9] focus:outline-none focus:ring-2 focus:ring-[#4a6741]/30"
              >
                {facilityOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

           
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
                Current Load (kWh)
              </label>
              <input
                type="number"
                name="current_load"
                value={form.current_load}
                onChange={handleChange}
                placeholder="e.g. 450"
                className="w-full border border-[#4a6741]/20 rounded-xl px-4 py-3 text-sm text-[#2d3a2d] bg-[#f9fbf9] focus:outline-none focus:ring-2 focus:ring-[#4a6741]/30"
              />
            </div>

           
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
                  Hour (0–23)
                </label>
                <input
                  type="number"
                  name="hour"
                  value={form.hour}
                  onChange={handleChange}
                  min={0}
                  max={23}
                  className="w-full border border-[#4a6741]/20 rounded-xl px-4 py-3 text-sm text-[#2d3a2d] bg-[#f9fbf9] focus:outline-none focus:ring-2 focus:ring-[#4a6741]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
                  Day of Week (0=Mon)
                </label>
                <input
                  type="number"
                  name="day_of_week"
                  value={form.day_of_week}
                  onChange={handleChange}
                  min={0}
                  max={6}
                  className="w-full border border-[#4a6741]/20 rounded-xl px-4 py-3 text-sm text-[#2d3a2d] bg-[#f9fbf9] focus:outline-none focus:ring-2 focus:ring-[#4a6741]/30"
                />
              </div>
            </div>
          </div>

          
          <button
            onClick={handlePredict}
            disabled={loading || !form.current_load}
            className="mt-8 w-full flex items-center justify-center gap-2 bg-[#4a6741] text-white px-6 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">
                  autorenew
                </span>
                Predicting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">bolt</span>
                Run Prediction
              </>
            )}
          </button>
        </div>

        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400">error</span>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        
        {result && (
          <div className="bg-[#eef3ec] border border-[#4a6741]/20 rounded-2xl px-8 py-7 mb-10 text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
              Predicted Next-Hour Load
            </p>
            <p className="text-5xl font-serif text-[#4a6741] mb-1">
              {result.predicted_kwh ?? result.prediction ?? "—"}
            </p>
            <p className="text-slate-500 text-sm">kWh</p>
            <Link
              href="/insights"
              className="mt-5 inline-flex items-center gap-2 text-sm text-[#4a6741] font-medium hover:underline"
            >
              <span className="material-symbols-outlined text-sm">insights</span>
              View full insights
            </Link>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
