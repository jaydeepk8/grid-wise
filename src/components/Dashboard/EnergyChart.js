export default function EnergyChart() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Consumption vs. Forecast</h3>
          <p className="text-sm text-gray-400">
            Real-time AI trend mapping
          </p>
        </div>

        <div className="text-sm text-gray-400 flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-700" /> Actual
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-dashed border-gray-400" /> AI Predicted
          </span>
        </div>
      </div>

      {/* Placeholder chart */}
      <div className="h-64 flex items-center justify-center text-gray-300">
        Chart will render from dataset
      </div>
    </div>
  );
}
