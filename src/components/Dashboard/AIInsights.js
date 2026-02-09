export default function AIInsights() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-1">AI Insights</h3>
      <p className="text-sm text-gray-400 mb-4">
        Prioritized support decisions
      </p>

      <div className="space-y-4 flex-1">
        <div className="border rounded-xl p-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Optimize HVAC Chillers</h4>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
              HIGH
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Forecasted peak at 14:00. Pre-cooling recommended.
          </p>
          <div className="flex gap-4 text-sm mt-3 text-green-600">
            <span>+$450</span>
            <span>-0.8T CO₂</span>
          </div>
        </div>

        <div className="border rounded-xl p-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Shift Boiler Cycle</h4>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
              MEDIUM
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Delay sterilization cycle to utilize solar surplus.
          </p>
          <div className="text-sm mt-3 text-green-600">+$120</div>
        </div>
      </div>

      <button className="mt-6 bg-[#1f2d1f] text-white rounded-xl py-3 text-sm font-medium">
        EXECUTE ALL RECOMMENDATIONS
      </button>
    </div>
  );
}
