"use client";

import { useState, useRef } from "react";

// Generate realistic 24-hour sample data based on facility energy profile
function generateSampleRows(facilityType) {
  const now = new Date();
  now.setMinutes(0, 0, 0, 0);

  // Hour-by-hour multipliers derived from real training data patterns
  const profiles = {
    hospital: {
      base: 590,
      pattern: [0.62,0.60,0.59,0.58,0.58,0.60,0.72,0.88,1.05,1.20,1.35,1.40,1.38,1.30,1.22,1.18,1.10,0.95,0.80,0.64,0.62,0.62,0.62,0.62],
      noise: 18,
    },
    "data-center": {
      base: 1219,
      pattern: [0.85,0.84,0.83,0.83,0.84,0.86,0.90,0.96,1.05,1.12,1.18,1.19,1.18,1.15,1.12,1.10,1.08,1.02,0.96,0.90,0.87,0.86,0.85,0.85],
      noise: 22,
    },
    mnc: {
      base: 531,
      pattern: [0.50,0.49,0.49,0.48,0.48,0.50,0.60,0.85,1.10,1.35,1.45,1.48,1.42,1.38,1.50,1.42,1.30,1.10,0.70,0.58,0.55,0.53,0.51,0.50],
      noise: 28,
    },
  };

  const p = profiles[facilityType] || profiles.hospital;
  const rows = [];

  // Seed the noise so preview looks stable on re-renders
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };

  for (let i = 23; i >= 0; i--) {
    const dt = new Date(now.getTime() - i * 3600 * 1000);
    const hour = dt.getHours();
    const noise = (rand() - 0.5) * 2 * p.noise;
    const energy = Math.max(p.base * 0.4, Math.round((p.base * p.pattern[hour] + noise) * 10) / 10);
    const pad = (n) => String(n).padStart(2, "0");
    const dtStr = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())} ${pad(hour)}:00:00`;
    rows.push({ datetime: dtStr, energy_kwh: energy });
  }
  return rows;
}

function rowsToCsvFile(rows, facilityType) {
  const csv = ["datetime,energy_kwh", ...rows.map((r) => `${r.datetime},${r.energy_kwh}`)].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  return new File([blob], `${facilityType}_sample.csv`, { type: "text/csv" });
}

const FACILITY_LABELS = {
  hospital: "Hospital",
  "data-center": "Data Center",
  mnc: "MNC Office",
};

export default function FileUpload({ onDataLoaded, onFileReady, onLoadingChange, facilityType = "hospital" }) {
  const [dragOver, setDragOver]       = useState(false);
  const [file, setFile]               = useState(null);
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [showSample, setShowSample]   = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const inputRef = useRef(null);

  // Stable sample rows (generated once per render)
  const sampleRows = generateSampleRows(facilityType);

  function handleFile(selectedFile) {
    setError(null);
    const allowed = [".csv", ".xlsx", ".xls"];
    const ext = "." + selectedFile.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) { setError("Only CSV and Excel (.xlsx, .xls) files are supported."); return; }
    setFile(selectedFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }

  async function runPredict(selectedFile) {
    setLoading(true);
    if (onLoadingChange) onLoadingChange(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-predict?facility_type=${facilityType}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); if (onLoadingChange) onLoadingChange(false); return; }
      onDataLoaded(data);
      if (onFileReady) onFileReady(selectedFile);
      setShowModal(false);
      setShowSample(false);
      setFile(null);
    } catch {
      setError("Failed to connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  }

  async function handlePredict() { if (file) await runPredict(file); }

  async function handleUploadSample() {
    setSampleLoading(true);
    const csvFile = rowsToCsvFile(sampleRows, facilityType);
    await runPredict(csvFile);
    setSampleLoading(false);
  }

  function resetModal() { setFile(null); setError(null); setShowModal(false); }

  return (
    <>
      {/* ── Buttons ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 border border-[#4a6741]/30 text-[#4a6741] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#4a6741] hover:text-white transition-all duration-300"
        >
          <span className="material-symbols-outlined text-sm">upload_file</span>
          Upload Data
        </button>

        <button
          onClick={() => setShowSample(true)}
          className="flex items-center gap-2 border border-slate-200 text-slate-500 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 transition-all duration-300"
        >
          <span className="material-symbols-outlined text-sm">science</span>
          Try Sample Data
        </button>
      </div>

      {/* ── Upload Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif text-[#2d3a2d]">Upload Energy Data</h2>
                <p className="text-xs text-slate-400 mt-1">CSV or Excel</p>
              </div>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600 transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 mb-4 ${
                dragOver ? "border-[#4a6741] bg-[#eef3ec]" : "border-slate-200 hover:border-[#4a6741]/50 hover:bg-[#f9fbf9]"
              }`}
            >
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">cloud_upload</span>
              {file ? (
                <div>
                  <p className="text-sm font-medium text-[#4a6741]">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-500">Drag &amp; drop your file here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                </div>
              )}
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
            </div>

            <div className="bg-[#f9fbf9] rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-2">Expected Format</p>
              <div className="font-mono text-xs text-slate-500 space-y-0.5">
                <p className="text-[#4a6741] font-semibold">datetime, energy_kwh</p>
                <p>2024-01-01 00:00:00, 446.9</p>
                <p>2024-01-01 01:00:00, 427.8</p>
                <p>2024-01-01 02:00:00, 451.4</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
                <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={resetModal} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition">Cancel</button>
              <button
                onClick={handlePredict}
                disabled={!file || loading}
                className="flex-1 py-3 bg-[#4a6741] text-white rounded-xl text-sm font-medium hover:bg-[#2d3a2d] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">autorenew</span>Predicting...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">bolt</span>Run Prediction</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sample Data Modal ── */}
      {showSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
              <div>
                <h2 className="text-xl font-serif text-[#2d3a2d]">Sample Data Preview</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {FACILITY_LABELS[facilityType] || facilityType} · Last 24 hours · 24 rows
                </p>
              </div>
              <button onClick={() => setShowSample(false)} className="text-slate-400 hover:text-slate-600 transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Info banner */}
            <div className="mx-8 mb-4 flex items-start gap-2 bg-[#eef3ec] rounded-xl px-4 py-3 shrink-0">
              <span className="material-symbols-outlined text-[#4a6741] text-sm mt-0.5">info</span>
              <p className="text-xs text-[#4a6741]">
                Realistic hourly energy readings generated for a <strong>{FACILITY_LABELS[facilityType] || facilityType}</strong>.
                Click <strong>Upload Sample</strong> to run predictions on this data instantly.
              </p>
            </div>

            {/* Table */}
            <div className="mx-8 mb-4 overflow-y-auto rounded-xl border border-slate-100 flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#4a6741] text-white">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold tracking-wider">#</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold tracking-wider">Datetime</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold tracking-wider">Energy (kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#f9fbf9]"}>
                      <td className="px-4 py-2 text-xs text-slate-300">{i + 1}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-600">{row.datetime}</td>
                      <td className="px-4 py-2 text-xs font-semibold text-[#2d3a2d] text-right">{row.energy_kwh}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 px-8 pb-8 shrink-0">
              <button onClick={() => setShowSample(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onClick={handleUploadSample}
                disabled={sampleLoading || loading}
                className="flex-1 py-3 bg-[#4a6741] text-white rounded-xl text-sm font-medium hover:bg-[#2d3a2d] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sampleLoading || loading ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">autorenew</span>Running Prediction...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">rocket_launch</span>Upload Sample</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
