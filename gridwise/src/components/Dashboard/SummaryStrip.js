export default function SummaryStrip() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <p className="text-xs uppercase text-gray-400">Estimated Savings</p>
        <h3 className="text-xl font-semibold mt-1">0</h3>
        <p className="text-sm text-gray-500">This billing cycle</p>
      </div>

      <div>
        <p className="text-xs uppercase text-gray-400">Emissions Reduction</p>
        <h3 className="text-xl font-semibold mt-1">0</h3>
        <p className="text-sm text-gray-500">0</p>
      </div>

      <div>
        <p className="text-xs uppercase text-gray-400">Efficiency Index</p>
        <h3 className="text-xl font-semibold mt-1">0</h3>
        <p className="text-sm text-green-600">0</p>
      </div>
    </div>
  );
}
