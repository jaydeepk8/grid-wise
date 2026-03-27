"use client";

const TABS = [
  "All Facilities",
  "Hospitals",
  "Data Centers",
  "MNCs",
];

export default function FacilitiesHeader({ activeTab, setActiveTab }) {
  return (
    <section className="max-w-7xl mx-auto px-6 mt-10">

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-serif text-[#2d3a2d] mb-2">
          Facilities Management Directory
        </h1>
        <p className="text-slate-500 max-w-xl">
          A comprehensive overview of essential services and their ecological footprint.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border
                ${
                  isActive
                    ? "bg-[#4a6741] text-white border-[#4a6741] shadow-md"
                    : "bg-white/60 text-slate-500 border-[#e2e8e2] hover:bg-white hover:text-[#4a6741]"
                }
              `}
            >
              {tab}
            </button>
          );
        })}
      </div>

    </section>
  );
}
