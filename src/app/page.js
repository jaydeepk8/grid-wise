"use client";

import { useState } from "react";
import FacilitiesHeader from "@/components/FacilitiesHeader";
import FacilityCard from "@/components/FacilityCard";
import Footer from "@/components/Footer";

export default function Home() {
  const [activeTab, setActiveTab] = useState("All Facilities");

  const facilities = [
    {
      id: 1,
      type: "Hospitals",
      imageSrc: "/facilities/hospital.png",
      status: "Optimal",
      statusColor: "text-[#4a6741]",
      category: "Essential Service",
      name: "Hospital",
      score: 0,
      dailyLoad: "0 kWh",
      source: "Solar / Grid",
    },
    {
      id: 2,
      type: "Data Centers",
      imageSrc: "/facilities/data.png",
      status: "High Demand",
      statusColor: "text-orange-600",
      category: "Data Services",
      name: "Data Center",
      score: 0,
      dailyLoad: "0 kWh",
      source: "Grid 100%",
    },
    {
      id: 3,
      type: "MNCs",
      imageSrc: "/facilities/mnc.png",
      status: "Efficient",
      statusColor: "text-[#4a6741]",
      category: "MNCs",
      name: "MNC",
      score: 0,
      dailyLoad: "0 kWh",
      source: "Wind Power",
    },
  ];

  const filteredFacilities =
    activeTab === "All Facilities"
      ? facilities
      : facilities.filter((f) => f.type === activeTab);

  return (
    <div className="bg-[#f1f4f1] min-h-screen pt-32">

      <FacilitiesHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Cards */}
      <section className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {filteredFacilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              {...facility}
            />
          ))}

        </div>
      </section>

      <Footer />
    </div>
  );
}
