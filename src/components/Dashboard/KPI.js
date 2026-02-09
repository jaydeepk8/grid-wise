export default function KPI() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        {
          title: "Current Demand",
          value: "1,425 kW",
          note: "▲ 3.2% vs baseline",
          noteColor: "text-red-500",
        },
        {
          title: "Predicted Demand",
          value: "1,580 kW",
          note: "AI Confidence: 98%",
          noteColor: "text-green-600",
        },
        {
          title: "Peak Load Risk",
          value: "Low Risk",
          note: "Stability Index: High",
          noteColor: "text-gray-500",
        },
        {
          title: "Renewable Mix",
          value: "82.5%",
          note: "+12% Solar Harvest",
          noteColor: "text-green-600",
        },
      ].map((kpi, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            {kpi.title}
          </p>
          <h2 className="text-2xl font-semibold mt-2">{kpi.value}</h2>
          <p className={`text-sm mt-1 ${kpi.noteColor}`}>{kpi.note}</p>
        </div>
      ))}
    </div>
  );
}
