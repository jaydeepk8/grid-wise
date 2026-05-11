"use client";

import { useState } from "react";
import { facilityConfig } from "@/lib/facilityConfig";

export default function AnomalyDetector({ facilityId = "hospital" }) {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);
  const config = facilityConfig[facilityId];

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setResult(null); setError(false);

    const form = new FormData();
    form.append("file", file);
    form.append("facility", config.facilityType);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/anomaly`, {
        method: "POST", body: form,
      });
      if (!res.ok) { setError(true); return; }
      const data = await res.json();
      if (!data?.anomalies) { setError(true); return; }
      setResult(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const statusColor = result?.status === "High"
    ? "text-red-600 bg-red-50 border-red-200"
    : "text-green-700 bg-green-50 border-green-200";

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-orange-500 text-xl">warning</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Anomaly Detection</h3>
          <p className="text-xs text-slate-400">Upload CSV to detect unusual energy readings</p>
        </div>
      </div>

      {/* Upload trigger */}
      <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-[#4a6741]/40 hover:bg-[#f9fbf9] transition-all group">
        <span className="material-symbols-outlined text-slate-300 group-hover:text-[#4a6741] transition-colors">upload_file</span>
        <span className="text-sm text-slate-400 group-hover:text-[#4a6741] transition-colors">
          {loading ? "Analysing..." : "Upload your energy CSV"}
        </span>
        <input type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={loading} />
      </label>

      {error && (
        <p className="text-red-500 text-xs mt-3">Failed to run anomaly detection. Check your CSV format.</p>
      )}

      {/* Results */}
      {result && (
        <div className="mt-5 space-y-4">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Total Rows</p>
              <p className="text-xl font-bold text-gray-800">{result.total_rows}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Anomalies</p>
              <p className="text-xl font-bold text-orange-500">{result.anomaly_count}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Rate</p>
              <p className="text-xl font-bold text-gray-800">{result.anomaly_percent}%</p>
            </div>
          </div>

          {/* Status badge */}
          <div className={`border rounded-xl px-4 py-3 flex items-center gap-2 ${statusColor}`}>
            <span className="material-symbols-outlined text-base">
              {result.status === "High" ? "error" : "check_circle"}
            </span>
            <p className="text-sm font-semibold">
              {result.status === "High"
                ? `High anomaly rate detected — ${result.anomaly_count} unusual readings found`
                : `Energy data looks normal — only ${result.anomaly_count} minor anomalies`}
            </p>
          </div>

          {/* Top anomalies list */}
          {result.anomalies?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Top Anomalies (row → value)
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {result.anomalies.slice(0, 10).map((a, i) => (
                  <div key={i} className="flex justify-between items-center bg-orange-50 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-slate-500">Row {a.index + 1}</span>
                    <span className="text-xs font-bold text-orange-600">{a.value} kWh</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
