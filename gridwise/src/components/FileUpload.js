"use client";

import { useState, useRef } from "react";

export default function FileUpload({ onDataLoaded }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef(null);

  function handleFile(selectedFile) {
    setError(null);
    setPreview(null);

    const allowed = [".csv", ".xlsx", ".xls"];
    const ext = "." + selectedFile.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setError("Only CSV and Excel (.xlsx, .xls) files are supported.");
      return;
    }

    setFile(selectedFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }

  async function handlePredict() {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-predict`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setPreview(data.preview);
      onDataLoaded(data);
      setShowModal(false);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError("Failed to connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function resetModal() {
    setFile(null);
    setPreview(null);
    setError(null);
    setShowModal(false);
  }

  return (
    <>
      {/* Upload Button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 border border-[#4a6741]/30 text-[#4a6741] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#4a6741] hover:text-white transition-all duration-300"
      >
        <span className="material-symbols-outlined text-sm">upload_file</span>
        Upload Data
      </button>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif text-[#2d3a2d]">Upload Energy Data</h2>
                <p className="text-xs text-slate-400 mt-1">CSV or Excel</p>
              </div>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600 transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drop Zone */}
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
                  <p className="text-sm font-medium text-slate-500">Drag & drop your file here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
            </div>

            {/* Format hint */}
            <div className="bg-[#f9fbf9] rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-2">Expected Format</p>
              <div className="font-mono text-xs text-slate-500 space-y-0.5">
                <p className="text-[#4a6741] font-semibold">datetime, energy_kwh</p>
                <p>2023-01-01 00:00:00, 446.9</p>
                <p>2023-01-01 01:00:00, 427.8</p>
                <p>2023-01-01 02:00:00, 451.4</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
                <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={resetModal}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePredict}
                disabled={!file || loading}
                className="flex-1 py-3 bg-[#4a6741] text-white rounded-xl text-sm font-medium hover:bg-[#2d3a2d] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                    Predicting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm"></span>
                    Run Prediction
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}