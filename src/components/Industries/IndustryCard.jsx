export default function IndustryCard({ industry }) {
  return (
    <div className="group h-full rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200">

      {/* Top Gradient */}

      <div
        className={`bg-gradient-to-r ${industry.color} h-3`}
      />

      <div className="p-8 flex flex-col h-full">

        <div className="flex items-center justify-between">

          <div className="text-6xl transition-transform duration-500 group-hover:scale-110">
            {industry.icon}
          </div>

          <span className="text-sm font-semibold uppercase tracking-widest text-cyan-600">
            {industry.subtitle}
          </span>

        </div>

        <h3 className="text-3xl font-bold text-slate-900 mt-8">
          {industry.title}
        </h3>

      </div>

    </div>
  );
}