export default function SoftwareCard({ software }) {
  return (
    <div
      className="
        bg-white
        rounded-2xl
        shadow-md
        hover:shadow-xl
        border
        border-gray-100
        hover:border-cyan-500
        p-6
        transition-all
        duration-300
        hover:-translate-y-2
        flex
        flex-col
        justify-between
      "
    >
      <div>

        <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center text-3xl mx-auto">
          💻
        </div>

        <h3 className="text-2xl font-bold text-center mt-5 text-slate-800">
          {software.name}
        </h3>

        <p className="text-cyan-600 text-center font-medium mt-2">
          {software.category}
        </p>

        <p className="text-gray-600 text-center mt-4 leading-relaxed">
          {software.description}
        </p>

      </div>
    </div>
  );
}