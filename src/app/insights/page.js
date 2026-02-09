"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import KPI from "@/components/Dashboard/KPI";
import EnergyChart from "@/components/Dashboard/EnergyChart";
import RenewableMix from "@/components/Dashboard/RenewableMix";
import FacilityStatus from "@/components/Dashboard/FacilityStatus";

export default function InsightsPage() {
  return (
    <div className="bg-[#f6f8f4] min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[#f6f8f4]">
        {/* ================= Executive Overview ================= */}
        <section className="max-w-7xl mx-auto px-6 pt-24">
          <div className="bg-[#eef3ec] rounded-3xl px-10 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h1 className="text-4xl font-serif text-[#2d3a2d] mb-2">
                Executive Overview
              </h1>

              <p className="text-[#6b7280] max-w-xl">
                Monitoring essential services with a commitment to sustainable
                growth and ecological balance.
              </p>
            </div>

            {/* IMPORT DATA BUTTON */}
            <button className="flex items-center gap-2 bg-[#1f2933] text-white px-6 py-3 rounded-full text-sm font-medium shadow hover:opacity-90 transition">
              <span className="material-symbols-outlined text-sm">
                file_upload
              </span>
              Import Data
            </button>
          </div>
        </section>

        {/* ================= KPI ROW ================= */}
        <section className="max-w-7xl mx-auto px-6 mt-12">
          <KPI />
        </section>

        {/* ================= CHARTS ================= */}
        <section className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EnergyChart />
          </div>

          <RenewableMix />
        </section>

        {/* ================= FACILITY / AI INSIGHTS ================= */}
        <section className="max-w-7xl mx-auto px-6 mt-12 pb-20">
          <FacilityStatus />
        </section>
      </main>

      <Footer />
    </div>
  );
}
