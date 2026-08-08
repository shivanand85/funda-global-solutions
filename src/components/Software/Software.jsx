import software from "../../data/software";
import SoftwareCard from "./SoftwareCard";

export default function Software() {
  return (
    <section id="expertise" className="py-24 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <p className="text-cyan-500 font-semibold uppercase tracking-widest">
            Technologies
          </p>

          <h2 className="text-5xl font-bold text-slate-900 mt-3">
            Software Expertise
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-6">
            We leverage industry-leading engineering software to deliver
            reliable simulation, design, automation and artificial intelligence
            solutions.
          </p>

        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

          {software.map((item) => (
            <SoftwareCard
              key={item.id}
              software={item}
            />
          ))}

        </div>

      </div>

    </section>
  );
}