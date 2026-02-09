export default function ExecutiveOverview() {
  return (
    <section className="w-full mb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-[#F1F5EE] rounded-3xl px-8 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          {/* Left Content */}
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#2d3a2d] mb-3 leading-tight">
              Executive Overview
            </h1>

            <p className="font-sans text-sm md:text-base font-normal text-[#6B7A6D] max-w-xl">
              Monitoring essential services with a commitment to sustainable
              growth and ecological balance.
            </p>
          </div>

          {/* Right Button */}
          <div>
            <button className="flex items-center gap-2 bg-[#2d3a2d] text-white font-sans text-sm font-medium px-6 py-3 rounded-full shadow hover:bg-[#4a6741] transition-colors">
              <span className="material-symbols-outlined text-sm">
                arrow_downward
              </span>
              Import Data
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
