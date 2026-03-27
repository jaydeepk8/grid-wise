export default function Working() {
  const steps = [
    {
      icon: "corporate_fare",
      step: "1. Select Facility",
      description:
        "Choose from Hospitals, Data Centers, or MNCs. Each facility has a unique energy profile monitored independently.",
    },
    {
      icon: "psychology",
      step: "2. AI Analysis",
      description:
        "The Random Forest model analyzes historical consumption patterns, rolling averages, and time-based features to identify trends.",
    },
    {
      icon: "energy_savings_leaf",
      step: "3. Predict & Act",
      description:
        "Get next-hour energy demand predictions with AI-driven recommendations to reduce waste, prevent overload, and optimize renewable usage.",
    },
  ];

  return (
    <section className="bg-[#f1f4f1] py-24 px-6">
      <div className="max-w-7xl mx-auto">

        
        <div className="text-center mb-20">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold mb-4">
            The Process
          </p>
          <h2
            className="text-5xl text-[#2d3a2d]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
          >
            How It Works
          </h2>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">

              
              <div className="w-28 h-28 rounded-full bg-[#e8ede6] flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-[#4a6741] text-4xl">
                  {step.icon}
                </span>
              </div>

              
              <div className="w-12 h-px bg-[#4a6741]/30 mb-6" />

              
              <h3 className="text-base font-semibold text-[#2d3a2d] mb-3">
                {step.step}
              </h3>

              
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                {step.description}
              </p>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}