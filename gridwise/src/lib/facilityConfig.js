export const facilityConfig = {
  hospital: {
    name: "Hospital",
    category: "Essential Service",
    status: "Optimal",
    statusColor: "text-[#4a6741]",
    icon: "local_hospital",
    description:
      "Hospitals require uninterrupted power supply 24/7. Lumiq monitors real-time consumption and predicts next-hour demand to ensure zero downtime.",
    hasData: true,
    dailyLoad: "~452 kWh avg",
    source: "Solar / Grid",
    accentColor: "#4a6741",
  },

  "data-center": {
    name: "Data Center",
    category: "Data Services",
    status: "High Demand",
    statusColor: "text-orange-600",
    icon: "dns",
    description:
      "Data centers are among the highest energy consumers. Lumiq predicts load spikes and recommends optimal energy sourcing strategies.",
    hasData: false,
    dailyLoad: "— kWh",
    source: "Grid 100%",
    accentColor: "#ea580c",
  },

  mnc: {
    name: "MNC",
    category: "MNCs",
    status: "Efficient",
    statusColor: "text-[#4a6741]",
    icon: "corporate_fare",
    description:
      "Multinational corporations benefit from Lumiq's renewable energy optimization, reducing carbon footprint while maintaining operational efficiency.",
    hasData: false,
    dailyLoad: "— kWh",
    source: "Wind Power",
    accentColor: "#0369a1",
  },
};