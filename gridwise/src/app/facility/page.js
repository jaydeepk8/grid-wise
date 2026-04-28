"use client";

import { useState } from "react";
import FacilitiesHeader from "@/components/FacilitiesHeader";
import FacilityCard from "@/components/FacilityCard";
import Footer from "@/components/Footer";

const facilities = [
  {
    id: "hospital",
    type: "Hospitals",
    imageSrc: "/facilities/hospital.png",
    category: "Essential Service",
    name: "Hospital", 
    source: "Solar / Grid",
  },
  {
    id: "data-center",
    type: "Data Centers",
    imageSrc: "/facilities/data.png",
    category: "Data Services",
    name: "Data Center",
    source: "Grid 100%",
  },
  {
    id: "mnc",
    type: "MNCs",
    imageSrc: "/facilities/mnc.png",
    category: "MNCs",
    name: "MNC",
    source: "Wind Power",
  },
];

export default function FacilityPage() {
  const [activeTab, setActiveTab] = useState("All Facilities");

  const filteredFacilities =
    activeTab === "All Facilities"
      ? facilities
      : facilities.filter((f) => f.type === activeTab);

  return (
    <div className="bg-[#f1f4f1] min-h-screen pt-32">
      <FacilitiesHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <section className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFacilities.map((facility) => (
            <FacilityCard key={facility.id} {...facility} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}